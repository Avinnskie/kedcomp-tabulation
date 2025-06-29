'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

type RoundData = {
  id: number;
  round: { name: string };
  room: { name: string };
  teamAssignments: {
    team: { id: number; name: string; participants: { id: number; name: string }[] };
    position: string;
  }[];
};

export default function RoundPage() {
  const { id } = useParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);

  const [teamScores, setTeamScores] = useState<Record<number, number>>({});
  const [individualScores, setIndividualScores] = useState<Record<number, Record<number, number>>>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/round/${id}`);
        const json = await res.json();

        if (res.ok) {
          if (json.isScored) {
            toast.warning('Scores already submitted for this round.');
            router.push('/round');
            return;
          }

          setData(json.roundAssignment);
        } else {
          toast.error(json.message || 'Failed to load data.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        roundAssignmentId: Number(id),
        teamScores: Object.entries(teamScores).map(([teamId, value]) => ({
          teamId: Number(teamId),
          value,
        })),
        individualScores: Object.entries(individualScores).flatMap(([teamId, scores]) =>
          Object.entries(scores).map(([participantId, value]) => ({
            teamId: Number(teamId),
            participantId: Number(participantId),
            value,
          }))
        ),
      };

      const res = await fetch('/api/scores', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();

      if (res.ok) {
        toast.success('Scores submitted successfully.');
        router.push('/round');
      } else {
        toast.error(json.message || 'Failed to submit scores.');
      }
    } catch (err) {
      toast.error('Unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data found or unauthorized.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Penilaian - {data.round.name} - {data.room.name}
      </h1>

      {data.teamAssignments.map(({ team, position }) => (
        <div key={team.id} className="border p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {team.name} ({position})
          </h2>
          <label className="block mb-2">
            <span className="text-sm">Team Score:</span>
            <input
              type="number"
              value={teamScores[team.id] ?? ''}
              onChange={e => setTeamScores({ ...teamScores, [team.id]: Number(e.target.value) })}
              className="border p-2 w-full"
            />
          </label>

          <h3 className="font-medium mt-4 mb-1">Individual Scores:</h3>
          {team.participants.map(p => (
            <label key={p.id} className="block mb-2">
              <span className="text-sm">{p.name}</span>
              <input
                type="number"
                value={individualScores[team.id]?.[p.id] ?? ''}
                onChange={e =>
                  setIndividualScores(prev => ({
                    ...prev,
                    [team.id]: {
                      ...(prev[team.id] || {}),
                      [p.id]: Number(e.target.value),
                    },
                  }))
                }
                className="border p-2 w-full"
              />
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
