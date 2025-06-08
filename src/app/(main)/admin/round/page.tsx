// app/admin/round/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Round {
  id: number;
  number: number;
}

export default function AdminRoundListPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const res = await fetch('/api/round');
        const data = await res.json();
        setRounds(data);
      } catch (error) {
        console.error('Gagal mengambil data ronde:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Round list</h1>

      {loading ? (
        <p>loading...</p>
      ) : rounds.length === 0 ? (
        <p>No round yet.</p>
      ) : (
        <ul className="space-y-3">
          {rounds.map(round => (
            <li key={round.id}>
              <Link
                href={`/admin/round/${round.id}`}
                className="block p-4 bg-white rounded shadow hover:bg-gray-100 transition"
              >
                Round {round.number}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
