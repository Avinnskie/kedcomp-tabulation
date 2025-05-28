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
    <div className="w-full relative p-5">
      <h1 className="text-2xl font-bold">Bracket KEDCOMP 2025</h1>
      <p className="text-muted-foreground mb-6">
        This bracket is to display which room all participants will be in.
      </p>

      {rounds.length === 0 ? (
        <p className="text-muted-foreground">There is no bracket available yet.</p>
      ) : (
        rounds.map(round => (
          <div key={round.id} className="mb-8 grid md:grid-cols-2 gap-2">
            {round.assignments?.map((a: any, i: number) => (
              <div
                key={i}
                className="border p-4 rounded-xl shadow-md bg-white hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center mb-2">
                  <span className="text-sm text-gray-400">Room</span>
                  <span className="text-xl font-semibold">{a.room.name}</span>
                  {/* <span className="text-sm text-gray-500">Judge: {a.judge?.name || 'TBA'}</span> */}
                </div>
                <div className="grid md:grid-cols-2 space-y-1">
                  {a.teamAssignments.map((ta: any, idx: number) => {
                    const posDebate: Record<string, string> = {
                      OG: 'Opening Government',
                      OO: 'Opening Opposition',
                      CG: 'Closing Government',
                      CO: 'Closing Opposition',
                    };

                    return (
                      <div key={idx} className={`text-center flex flex-col font-medium`}>
                        <h5 className="text-sm text-gray-400">{posDebate[ta.position]}</h5>
                        <h2 className="text-lg font-medium">{ta.team.name}</h2>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="fixed bottom-8 right-10 z-50 py-3 px-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
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
