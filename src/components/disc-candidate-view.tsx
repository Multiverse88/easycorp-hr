'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { discQuestions } from '@/lib/discData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/loading-overlay';

interface DiscCandidateViewProps {
  token: string;
  candidateName: string;
  position: string;
}

export function DiscCandidateView({ token, candidateName, position }: DiscCandidateViewProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, { most: string; least: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === 28;

  function handleSelect(questionId: number, word: string, type: 'most' | 'least') {
    setAnswers(prev => {
      const existing = prev[questionId] || { most: '', least: '' };

      if (existing[type] === word) {
        return { ...prev, [questionId]: { ...existing, [type]: '' } };
      }

      if (type === 'most' && existing.least === word) return prev;
      if (type === 'least' && existing.most === word) return prev;

      return { ...prev, [questionId]: { ...existing, [type]: word } };
    });
  }

  async function handleSubmit() {
    if (!allAnswered) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        most: answer.most,
        least: answer.least,
      }));

      const response = await fetch('/api/disc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: formattedAnswers }),
      });

      if (response.ok) {
        router.push(`/disc/${token}/success`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <LoadingOverlay visible={isSubmitting} message="Mengirim jawaban DISC..." />
      <div className="min-h-screen bg-slate-50">
        <header className="bg-blue-900 text-white p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <span className="text-blue-900 font-extrabold text-sm">EL</span>
              </div>
              <div>
                <div className="font-semibold text-sm">DISC Personality Test</div>
                <div className="text-xs text-blue-200">Easy Legal - Assessment Rekrutmen</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-800 rounded-full px-3 py-1 text-xs">
                {answeredCount}/28
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 border">
            <h2 className="font-bold text-lg">{candidateName}</h2>
            <p className="text-sm text-muted-foreground">Posisi: {position}</p>
          </div>

          {discQuestions.map((q) => {
            const answer = answers[q.id] || { most: '', least: '' };
            return (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="font-semibold mb-3">Soal {q.id}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">MOST (Paling Menggambarkan)</div>
                      <div className="space-y-2">
                        {q.words.map(w => (
                          <button
                            key={`most-${w.text}`}
                            onClick={() => handleSelect(q.id, w.text, 'most')}
                            className={`w-full p-2 rounded-lg text-sm border transition ${
                              answer.most === w.text
                                ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                                : 'hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            {w.text}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">LEAST (Tidak Menggambarkan)</div>
                      <div className="space-y-2">
                        {q.words.map(w => (
                          <button
                            key={`least-${w.text}`}
                            onClick={() => handleSelect(q.id, w.text, 'least')}
                            className={`w-full p-2 rounded-lg text-sm border transition ${
                              answer.least === w.text
                                ? 'bg-red-100 border-red-400 text-red-800 font-medium'
                                : 'hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            {w.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="sticky bottom-4">
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="w-full py-6 text-lg"
            >
              Kirim Jawaban
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
