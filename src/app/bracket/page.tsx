'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BracketPage() {
  const [rounds, setRounds] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/getBracket')
      .then(res => res.json())
      .then(data => setRounds(data.rounds));
  }, []);
  return (
    <div className="w-full relative p-5 md:ml-[200px]">
      <h1 className="text-2xl font-bold">Bracket KEDCOMP 2025</h1>
      <p className="text-muted-foreground mb-6">
        This bracket is to display which room all participants will be in.
      </p>

      {rounds.map(round => (
        <div key={round.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Round {round.number}</h2>

          {round.assignments.map((a: any, i: number) => (
            <div key={i} className="border p-4 mb-2 rounded shadow bg-white">
              <p>
                <strong>Room:</strong> {a.room.name}
              </p>
              <p>
                <strong>Judge:</strong> {a.judge?.name || 'TBA'}
              </p>
              <p>
                <strong>Teams:</strong> {a.teams.map((t: any) => t.name).join(', ')}
              </p>
            </div>
          ))}
        </div>
      ))}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="fixed bottom-8 right-10 z-50 py-3 px-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              onClick={async () => {
                await fetch('/api/generateBracket', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ roundNumber: 1 }),
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) alert('Bracket berhasil digenerate!');
                  });
              }}
            >
              <Repeat width={30} height={30} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Bracket</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
