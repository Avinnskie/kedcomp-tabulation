'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast, Toaster } from 'sonner';

interface Judge {
  id: number;
  name: string;
  email: string;
}

interface Room {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  roundName: string;
  roundNumber: number;
  roomId: number;
  judgeIds?: number[];
}

export default function AssignJudgePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Record<number, { judgeIds: number[]; roomId: number }>>(
    {}
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/assign-judges')
      .then(res => res.json())
      .then(json => {
        setAssignments(json.assignments || []);
        setJudges(json.judges || []);
        setRooms(json.rooms || []);
        const initial = Object.fromEntries(
          (json.assignments || []).map((a: Assignment) => [
            a.id,
            {
              judgeIds: a.judgeIds || [],
              roomId: a.roomId,
            },
          ])
        );
        setSelected(initial);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(selected).map(([assignmentId, { judgeIds, roomId }]) => ({
        assignmentId: Number(assignmentId),
        judgeIds,
        roomId,
      }));

      const res = await fetch('/api/admin/assign-judges', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        toast.success('Berhasil menyimpan penugasan juri & ruangan');
      } else {
        toast.error('Gagal menyimpan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🧑‍⚖️ Assign Juri & Ruangan</h1>

      {assignments.map(a => (
        <Card key={a.id}>
          <CardContent className="p-4 space-y-2">
            <div className="text-lg font-semibold">{a.roundName}</div>
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <Label className="block mb-1">
                  {a.roundNumber === 5 ? 'Pilih 3 Juri:' : 'Pilih Juri:'}
                </Label>
                {a.roundNumber === 5 ? (
                  [0, 1, 2].map(i => (
                    <Select
                      key={i}
                      value={selected[a.id]?.judgeIds?.[i]?.toString() || ''}
                      onValueChange={val => {
                        const newJudgeIds = [...(selected[a.id]?.judgeIds || [])];
                        newJudgeIds[i] = Number(val);
                        setSelected(prev => ({
                          ...prev,
                          [a.id]: { ...prev[a.id], judgeIds: newJudgeIds },
                        }));
                      }}
                    >
                      <SelectTrigger className="w-64 mt-1">
                        <SelectValue placeholder={`Juri ${i + 1}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {judges.map(j => (
                          <SelectItem key={j.id} value={j.id.toString()}>
                            {j.name} ({j.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))
                ) : (
                  <Select
                    value={selected[a.id]?.judgeIds?.[0]?.toString() || ''}
                    onValueChange={val => {
                      setSelected(prev => ({
                        ...prev,
                        [a.id]: { ...prev[a.id], judgeIds: [Number(val)] },
                      }));
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Pilih juri" />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map(j => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.name} ({j.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="block mb-1">Pilih Ruangan:</Label>
                <Select
                  value={selected[a.id]?.roomId.toString() || ''}
                  onValueChange={val => {
                    setSelected(prev => ({
                      ...prev,
                      [a.id]: { ...prev[a.id], roomId: Number(val) },
                    }));
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button disabled={saving} onClick={handleSave}>
        Simpan Penugasan
      </Button>
    </div>
  );
}
