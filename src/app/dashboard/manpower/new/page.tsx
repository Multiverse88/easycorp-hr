import { ManpowerForm } from '@/components/manpower-form';
import Link from 'next/link';

export default function ManpowerNewPage() {
  return (
    <div>
      <Link href="/dashboard/manpower" className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke daftar
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Buat Manpower Request Baru</h1>
      <ManpowerForm />
    </div>
  );
}
