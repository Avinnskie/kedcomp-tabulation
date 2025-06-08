'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
};

type RoundItem = RoundData & { isScored: boolean };

function Loader() {
  return (
    <div className="relative w-8 h-8 [perspective:67px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 w-full h-full bg-zinc-800 origin-left animate-loader"
          style={{ animationDelay: `${0.15 * (i + 1)}s` }}
        ></div>
      ))}
    </div>
  );
}

export default function Rounds() {
  const { data: session } = useSession();
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  if (!session) return <div>Please login first.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Round</h1>
      {rounds.length === 0 ? (
        <p>You have not been assigned any rounds.</p>
      ) : (
        <div className="space-y-4">
          {rounds.map(round => (
            <div
              key={round.id}
              className="border rounded p-4 shadow cursor-pointer hover:bg-gray-100 transition"
              onClick={() => router.push(`/round/${round.id}`)}
            >
              <h2 className="text-xl font-semibold">
                {round.round.name} - Room: {round.room.name}
              </h2>
              <p className="text-sm mb-2">
                Status:{' '}
                <span className={`${round.isScored ? 'text-green-600' : 'text-red-600'}`}>
                  {round.isScored ? 'Assessed' : 'Not Rated'}
                </span>
              </p>
              <div>
                <h3 className="font-medium">Tim:</h3>
                <ul className="list-disc pl-5">
                  {round.teamAssignments.map(ta => (
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
