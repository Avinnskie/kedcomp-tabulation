'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function RoomDetailDialog({
  open,
  onOpenChange,
  roomId,
  roundId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
  roundId: number | null;
}) {
  const [roomDetail, setRoomDetail] = useState<any>(null);

  useEffect(() => {
    if (roomId && roundId && open) {
      fetch(`/api/bracket/room/${roomId}?roundId=${roundId}`)
        .then(res => res.json())
        .then(data => setRoomDetail(data))
        .catch(() => toast.error('Failed to load room detail'));
    }
  }, [roomId, roundId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Room: {roomDetail?.name ?? '—'} — {roomDetail?.round?.name ?? '—'}
          </DialogTitle>
        </DialogHeader>

        {!roomDetail ? (
          <p className="text-gray-500">Loading room detail...</p>
        ) : (
          <>
            {roomDetail.round?.motion && (
              <div className="p-3 border rounded bg-gray-100 mb-3 max-h-40 overflow-y-auto">
                <i>
                  <q>{roomDetail.round.motion}</q>
                </i>

                {roomDetail.round?.description ? (
                  <p className="mt-2 text-gray-700 whitespace-pre-line text-sm">
                    {roomDetail.round.description}
                  </p>
                ) : (
                  <p className="mt-2 text-gray-400 italic text-sm">No description provided.</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <h2 className="font-semibold mb-1">Judge:</h2>
              <p>{roomDetail.judge?.name ?? 'TBA'}</p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Teams & Scores:</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {roomDetail.teamAssignments?.map((ta: any, idx: number) => (
                  <div
                    key={idx}
                    className="border p-3 rounded bg-white shadow flex flex-col space-y-2"
                  >
                    <div className="font-semibold"></div>
                    <div>
                      <strong>Team Score:</strong> {ta.teamScore ?? '-'}
                    </div>
                    <div>
                      <strong>Participants:</strong>
                      <ul className="list-disc ml-5">
                        {ta.team.participants.map((p: any) => {
                          const indivScore = ta.individualScores?.find(
                            (s: any) => s.participantId === p.id
                          )?.value;
                          return (
                            <li key={p.id}>
                              {p.name} — Score: {indivScore ?? '-'}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
