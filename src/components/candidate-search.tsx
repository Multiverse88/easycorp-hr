'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, User, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface PoolCandidate {
  id: string;
  nama: string;
  wa: string;
  posisi: string;
  tahapan: string;
  platform: string;
  domisili: string;
}

export type PoolStatus = 'loading' | 'ready' | 'unconfigured' | 'unavailable';

interface CandidateSearchFieldProps {
  candidates: PoolCandidate[];
  status: PoolStatus;
  selected: PoolCandidate | null;
  onSelect: (candidate: PoolCandidate | null) => void;
  /** Dipakai hanya saat fallback manual (pool belum dikonfigurasi / tidak tersedia) */
  manualValue: string;
  onManualChange: (value: string) => void;
  lastUpdated: string | null;
}

const MAX_RESULTS = 25;

export function CandidateSearchField({
  candidates,
  status,
  selected,
  onSelect,
  manualValue,
  onManualChange,
  lastUpdated,
}: CandidateSearchFieldProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, MAX_RESULTS);
    return candidates
      .filter(
        (c) =>
          c.nama.toLowerCase().includes(q) ||
          c.posisi.toLowerCase().includes(q) ||
          c.wa.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS);
  }, [candidates, query]);

  // Fallback manual: hanya jika pool belum dikonfigurasi atau sedang tidak bisa dihubungi
  if (status === 'unconfigured' || status === 'unavailable') {
    return (
      <div className="space-y-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            {status === 'unavailable' ? (
              <WifiOff className="h-4 w-4 text-amber-500/70" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>
          <Input
            id="nama"
            value={manualValue}
            onChange={(e) => onManualChange(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="h-14 rounded-xl border-border bg-muted/30 pl-11 font-semibold transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            required
          />
        </div>
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {status === 'unavailable'
            ? 'Koneksi ke data spreadsheet terputus — sementara bisa ketik manual.'
            : 'Data spreadsheet belum dikonfigurasi — sementara bisa ketik manual. Lihat appsheet/SETUP.md.'}
        </p>
      </div>
    );
  }

  function pick(candidate: PoolCandidate) {
    onSelect(candidate);
    setQuery('');
    setOpen(false);
  }

  function handleInputChange(value: string) {
    if (selected) onSelect(null);
    setQuery(value);
    setOpen(true);
    setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>
      <Input
        id="nama"
        value={selected ? selected.nama : query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik nama kandidat untuk mencari…"
        className="h-14 rounded-xl border-border bg-muted/30 pl-11 pr-28 font-semibold transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
        autoComplete="off"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
          {status === 'loading' ? 'Memuat…' : `${candidates.length} kandidat`}
        </span>
      </div>

      {selected && (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {selected.posisi || 'Posisi tidak tercatat'}
          {selected.tahapan ? ` · ${selected.tahapan}` : ''}
          {selected.platform ? ` · via ${selected.platform}` : ''}
          {selected.domisili ? ` · ${selected.domisili}` : ''}
        </p>
      )}

      {open && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-background/95 shadow-xl shadow-rose-950/10 backdrop-blur-md">
          {status === 'loading' && candidates.length === 0 ? (
            <div className="p-4 text-center text-sm font-medium text-muted-foreground">
              Memuat data kandidat dari spreadsheet…
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                    i === activeIndex ? 'bg-muted/70' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">{c.nama}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.posisi || 'Posisi tidak tercatat'}
                      {c.tahapan ? ` · ${c.tahapan}` : ''}
                      {c.platform ? ` · ${c.platform}` : ''}
                    </span>
                  </span>
                  {c.wa && (
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.wa}</span>
                  )}
                </button>
              ))}
              {candidates.length > MAX_RESULTS && !query.trim() && (
                <div className="border-t border-border px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                  Menampilkan {MAX_RESULTS} dari {candidates.length} kandidat — ketik untuk memfilter
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-sm font-medium text-muted-foreground">
              Tidak ada kandidat &quot;{query.trim()}&quot; di spreadsheet.
              <br />
              Tambahkan dulu lewat AppSheet/spreadsheet, data di sini otomatis menyala.
            </div>
          )}
        </div>
      )}

      {lastUpdated && (
        <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">
          Sinkron realtime · terakhir diperbarui {lastUpdated}
        </p>
      )}
    </div>
  );
}
