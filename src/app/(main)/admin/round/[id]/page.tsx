'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

type JudgeRecap = {
  judgeName: string;
  isSubmitted: boolean;
  scores: {
    teamName: string;
    vp: number;
    participants: { name: string; value: number }[];
  }[];
};

type TeamScore = {
  teamName: string;
  totalScore: number;
};

type RoomRecap = {
  roomName: string;
  judges: JudgeRecap[];
  teamScores: TeamScore[];
  isComplete: boolean;
};

type RoundRecap = {
  roundName: string;
  rooms: RoomRecap[];
};

export default function RoundRecapPage() {
  const { id } = useParams();
  const [data, setData] = useState<RoundRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const fetchRecap = async () => {
      try {
        const res = await fetch(`/api/round/${id}/recap`);
        const json = await res.json();
        if (json && Array.isArray(json.rooms)) {
          setData(json);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();
  }, [id]);

  const markAsComplete = async () => {
    setMarking(true);
    try {
      const res = await fetch(`/api/round/${id}/complete`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('✅ Ronde berhasil ditandai sebagai selesai!');
      } else {
        toast.error(json.message || '❌ Gagal menandai sebagai selesai');
      }
    } catch (err) {
      toast.error('❌ Terjadi kesalahan internal');
    } finally {
      setMarking(false);
    }
  };

  if (!data) return <div className="p-6">Data tidak ditemukan.</div>;

  const allRoomsComplete = data.rooms.every(room => room.isComplete);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Rekap Ronde: {data.roundName}</h1>

      {data.rooms.map((room, idx) => (
        <div key={idx} className="mb-8 border-b pb-4">
          <h2 className="text-xl font-semibold mb-2">
            Ruangan: {room.roomName} {room.isComplete ? '✅' : '❌'}
          </h2>

          <h3 className="text-md font-semibold">Status Penilaian Juri & Nilai:</h3>
          <ul className="mb-3 list-disc list-inside">
            {room.judges.map((j, i) => (
              <li key={i} className="mb-2">
                {j.judgeName} - {j.isSubmitted ? '✅ Sudah' : '❌ Belum'}
                {j.isSubmitted && j.scores.length > 0 && (
                  <ul className="ml-4 list-disc list-inside text-sm text-gray-700">
                    {j.scores.map((s, si) => (
                      <li key={si}>
                        {s.teamName}: <span className="font-medium">{s.vp} VP</span>
                        <ul className="ml-4 list-disc list-inside text-xs text-gray-600">
                          {s.participants.map((p, pi) => (
                            <li key={pi}>
                              {p.name}: {p.value}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button
        onClick={markAsComplete}
        disabled={!allRoomsComplete || marking}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {marking
          ? 'Menyimpan...'
          : allRoomsComplete
            ? 'Tandai Ronde Selesai'
            : 'Tunggu semua ruangan selesai'}
      </button>
    </div>
  );
}
