'use client';
import * as Tabs from '@radix-ui/react-tabs';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
        <Tabs.Root defaultValue={rounds[0]?.id} className="w-full">
          <Tabs.List className="flex gap-2 mb-4 border-b">
            {rounds.map((round: any) => (
              <Tabs.Trigger
                key={round.id}
                value={round.id}
                className="px-4 py-2 text-sm font-semibold border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                {round.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {rounds.map((round: any) => (
            <Tabs.Content key={round.id} value={round.id} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                {round.assignments?.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="border p-4 rounded-xl shadow-md bg-white hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col items-center mb-2">
                      <span className="text-sm text-gray-400">Room</span>
                      <span className="text-xl font-semibold">{a.room.name}</span>
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
                          <div key={idx} className="text-center flex flex-col font-medium">
                            <h5 className="text-sm text-gray-400">{posDebate[ta.position]}</h5>
                            <h2 className="text-lg font-medium">{ta.team.name}</h2>
                            <div className="text-sm text-gray-500">
                              Judge {a.judge?.name || 'TBA'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      {/* Generate Button tetap */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={async () => {
                const res = await fetch('/api/round/generate-prelims', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  setRounds(prev => [...prev, ...(data.rounds ?? [])]);
                  toast.success(data.message);
                } else {
                  toast.error(data.error);
                }
              }}
              className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Generate Bracket</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
