'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type RoundData = {
  id: number;
  round: {
    name: string;
    number: number;
  };
  room: {
    name: string;
  };
  teamAssignments: {
    team: {
      id: number;
      name: string;
    };
    position: string;
  }[];
  isScored: boolean;
};

export default function Rounds() {
  const { data: session } = useSession();
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRounds = async () => {
      const res = await fetch('/api/round/judge');
      const data = await res.json();
      setRounds(data.rounds);
      setLoading(false);
    };

    if (session?.user) {
      fetchRounds();
    }
  }, [session]);

  if (!session) return <div>Silakan login terlebih dahulu.</div>;
  if (loading) return <div>Memuat data ronde...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ronde Anda</h1>
      {rounds.length === 0 ? (
        <p>Anda belum ditugaskan di ronde mana pun.</p>
      ) : (
        <div className="space-y-4">
          {rounds.map(round => (
            <div key={round.id} className="border rounded p-4 shadow">
              <h2 className="text-xl font-semibold">
                {round.round.name} - Ruangan: {round.room.name}
              </h2>
              <p className="text-sm mb-2">
                Status:{' '}
                <span className={`${round.isScored ? 'text-green-600' : 'text-red-600'}`}>
                  {round.isScored ? 'Sudah Dinilai' : 'Belum Dinilai'}
                </span>
              </p>
              <div>
                <h3 className="font-medium">Tim:</h3>
                <ul className="list-disc pl-5">
                  {round.teamAssignments.map((ta, idx) => (
                    <li key={ta.team.id}>
                      {ta.team.name} ({ta.position})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
