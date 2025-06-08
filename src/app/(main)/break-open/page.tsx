'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, LoaderCircle, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Team {
  teamId: number;
  teamName: string;
  totalPoints: number;
  totalScore: number;
}

export default function BreakSemifinalPage() {
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTopTeams = async () => {
    const res = await fetch('/api/tabulation');
    const json = await res.json();

    const sorted = json.teamTabulationPrelim // ← ubah di sini!
      .map((team: any) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        totalPoints: team.totalPoints,
        totalScore: team.totalTeamScore,
      }))
      .sort((a: Team, b: Team) => {
        if (b.totalPoints === a.totalPoints) {
          return b.totalScore - a.totalScore;
        }
        return b.totalPoints - a.totalPoints;
      })
      .slice(0, 8);

    setTopTeams(sorted);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/break/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate');
      setGenerated(true);
      toast.success('The semifinal bracket has been made!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTeams();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🏆 Teams Qualify for the Semifinals</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topTeams.map((team, i) => (
          <Card key={team.teamId}>
            <CardContent className="p-4 space-y-1">
              <div className="font-semibold text-lg">
                #{i + 1} - {team.teamName}
              </div>
              <div>
                Total Point: <strong>{team.totalPoints}</strong>
              </div>
              <div>
                Total Score: <strong>{team.totalScore}</strong>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {!generated && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Repeat />}
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Generate Bracket Grand Final</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
