'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Repeat } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RoomDetailDialog } from '@/src/components/molecules/roomDetailDialog';
import { useSession } from 'next-auth/react';

export default function BracketPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/getBracket')
      .then(res => res.json())
      .then(data => setRounds(data.rounds));
  }, []);

  return (
    <div className="w-full relative p-2 sm:p-5">
      <h1 className="text-xl sm:text-2xl font-bold">Bracket KEDCOMP 2025</h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
        This bracket is to display which room all participants will be in.
      </p>

      {rounds.length === 0 ? (
        <p className="text-muted-foreground">There is no bracket available yet.</p>
      ) : (
        <Tabs.Root defaultValue={rounds[0]?.id} className="w-full">
          <Tabs.List className="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-2 mb-4 border-b pb-2">
            {rounds.map((round: any) => (
              <Tabs.Trigger
                key={round.id}
                value={round.id}
                className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                {round.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {rounds.map((round: any) => (
            <Tabs.Content key={round.id} value={round.id} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {round.assignments?.map((a: any, i: number) => {
                  const posDebate: Record<string, string> = {
                    OG: 'Opening Government',
                    OO: 'Opening Opposition',
                    CG: 'Closing Government',
                    CO: 'Closing Opposition',
                  };

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedRoomId(a.room.id);
                        setSelectedRoundId(round.id);
                        setDialogOpen(true);
                      }}
                      className="cursor-pointer border p-3 sm:p-4 rounded-xl shadow-md bg-white hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col items-center mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm text-gray-400">Room</span>
                        <span className="text-lg sm:text-xl font-semibold">{a.room.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-1">
                        {a.teamAssignments.map((ta: any, idx: number) => (
                          <div key={idx} className="text-center flex flex-col font-medium">
                            <h5 className="text-xs sm:text-sm text-gray-400 mb-1">{posDebate[ta.position]}</h5>
                            <h2 className="text-sm sm:text-lg font-medium break-words">{ta.team.name}</h2>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      {/* Modular Dialog */}
      <RoomDetailDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) {
            setSelectedRoomId(null);
            setSelectedRoundId(null);
          }
        }}
        roomId={selectedRoomId}
        roundId={selectedRoundId}
      />

      {/* Floating Button */}
      {isAdmin && (
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
      )}
    </div>
  );
}
