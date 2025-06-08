'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Participant = {
  id: number;
  name: string;
};

type Team = {
  id: number;
  name: string;
  participants: Participant[];
};

type TeamAssignment = {
  team: Team;
  position: string;
};

type RoundData = {
  id: number;
  round: { name: string };
  room: { name: string };
  teamAssignments: TeamAssignment[];
};

type RoundResponse = {
  roundAssignment: RoundData;
  isScored: boolean;
  error?: string;
};

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

export default function RoundPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);

  // Separate states
  const [teamScores, setTeamScores] = useState<Record<number, number>>({});
  const [individualScores, setIndividualScores] = useState<Record<number, Record<number, number>>>(
    {}
  );

  useEffect(() => {
    const fetchRound = async () => {
      const res = await fetch(`/api/round/${id}`);
      const json: RoundResponse = await res.json();

      if (json.error) {
        toast.error(json.error);
        return;
      }

      if (json.isScored) {
        toast.warning('Score have already been submitted.');
        router.push('/round');
        return;
      }

      setData(json.roundAssignment);
      setLoading(false);
    };

    fetchRound();
  }, [id, router]);

  const handleTeamScoreChange = (teamId: number, value: string) => {
    const floatVal = parseFloat(value);
    if (isNaN(floatVal)) return;
    setTeamScores(prev => ({ ...prev, [teamId]: floatVal }));
  };

  const handleIndividualScoreChange = (teamId: number, participantId: number, value: string) => {
    const floatVal = parseFloat(value);
    if (isNaN(floatVal)) return;

    setIndividualScores(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [participantId]: floatVal,
      },
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      roundAssignmentId: Number(id),
      teamScores: Object.entries(teamScores).map(([teamId, value]) => ({
        teamId: parseInt(teamId),
        value,
      })),
      individualScores: Object.entries(individualScores).flatMap(([teamId, members]) =>
        Object.entries(members).map(([participantId, value]) => ({
          teamId: parseInt(teamId),
          participantId: parseInt(participantId),
          value,
        }))
      ),
    };

    const res = await fetch('/api/scores', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await res.json();

    if (res.ok) {
    toast.success('Score submitted successfully!');
    router.push('/round');
    } else {
    toast.error('Failed to submit: ' + result.message);
    }

  if (!data) return <div>Data not Found!</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Assessment - {data.round.name} - Room {data.room.name}
      </h1>

      {data.teamAssignments.map(({ team, position }) => (
        <div key={team.id} className="border rounded p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {team.name} ({position})
          </h2>

          {/* Form Skor Tim */}
          <label className="block mb-2">
            <span className="text-sm">Total Team Score:</span>
            <input
              type="number"
              className="border p-2 w-full"
              value={teamScores[team.id] ?? ''}
              onChange={e => handleTeamScoreChange(team.id, e.target.value)}
            />
          </label>

          {/* Form Skor Individu */}
          <h3 className="font-medium mt-4 mb-1">Individual Score:</h3>
          {team.participants.map(p => (
            <label key={p.id} className="block mb-2">
              <span className="text-sm">{p.name}</span>
              <input
                type="number"
                className="border p-2 w-full"
                value={individualScores[team.id]?.[p.id] ?? ''}
                onChange={e => handleIndividualScoreChange(team.id, p.id, e.target.value)}
              />
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Score
      </button>
    </div>
  );
}
