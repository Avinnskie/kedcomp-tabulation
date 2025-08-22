'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronsUp, ChevronsDown, Repeat, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

type TeamTabulation = {
  teamId: number;
  teamName: string;
  totalTeamScore: number;
  totalPoints: number;
  rounds: {
    roundId: number;
    teamScore: number;
    rank: number;
    points: number;
  }[];
};

type SpeakerTabulation = {
  speakerId: number;
  speakerName: string;
  teamName: string;
  totalScore: number;
  averageScore: number;
  scores: {
    roundId: number;
    roundName: string;
    value: number;
  }[];
};

export default function TabulationPage() {
  const [prelimData, setPrelimData] = useState<TeamTabulation[]>([]);
  const [quarterData, setQuarterData] = useState<TeamTabulation[]>([]);
  const [breakData, setBreakData] = useState<TeamTabulation[]>([]);
  const [grandFinalData, setGrandFinalData] = useState<TeamTabulation[]>([]);
  const [individualData, setIndividualData] = useState<SpeakerTabulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [semiGenerating, setSemiGenerating] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [quarterFinalComplete, setQuarterFinalComplete] = useState(false);
  const [canGenerateSemi, setCanGenerateSemi] = useState(false);
  const [fixingSemi, setFixingSemi] = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/tabulation');
        const json = await res.json();

        setPrelimData(json.teamTabulationPrelim || []);
        setQuarterData(json.teamTabulationQuarter || []);
        setBreakData(json.teamTabulationSemifinal || []);
        setGrandFinalData(json.teamTabulationGrandFinal || []);

        const sorted = (json.individualTabulation || []).sort(
          (a: SpeakerTabulation, b: SpeakerTabulation) => b.averageScore - a.averageScore
        );
        setIndividualData(sorted);

        // Check quarter final status
        const roundIdQuarter = json.teamTabulationQuarter?.[0]?.rounds?.[0]?.roundId;
        if (roundIdQuarter) {
          const statusRes = await fetch(`/api/bracket/status?roundId=${roundIdQuarter}`);
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            const isComplete = statusJson.statistics?.isComplete || false;
            const hasScores = statusJson.statistics?.totalScores > 0;
            setQuarterFinalComplete(isComplete);
            setCanGenerateSemi(isComplete || hasScores);
          }
        }
      } catch (err) {
        console.error('Error fetching tabulation data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const generateSemiFinal = async () => {
    setSemiGenerating(true);
    try {
      const res = await fetch('/api/bracket/generate?round=semifinal', { 
        method: 'POST' 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate semifinal');
      }

      const data = await res.json();
      
      if (data.success) {
        toast.success('Semi Final Bracket Generated Successfully!');
        
        // Optionally show some details
        if (data.data?.qualifiedTeams) {
          console.log('Qualified teams:', data.data.qualifiedTeams);
        }
        
        // Refresh data to show updated semifinal bracket
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to generate semifinal');
      }
    } catch (err) {
      console.error('Generate semifinal error:', err);
      toast.error(`Error generating semifinal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSemiGenerating(false);
    }
  };

  const handleGenerateGrandFinal = async () => {
    setGeneratingFinal(true);
    try {
      const res = await fetch('/api/break/grandfinal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Successfully generated the Grand Final bracket!');
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Generate grand final error:', err);
      toast.error(`Failed to generate grand final: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingFinal(false);
    }
  };

  const fixSemifinal = async () => {
    setFixingSemi(true);
    try {
      const res = await fetch('/api/bracket/fix-semifinal', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fix semifinal');
      }
      
      if (data.success) {
        toast.success('Semifinal bracket fixed successfully!');
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to fix semifinal');
      }
    } catch (err) {
      console.error('Fix semifinal error:', err);
      toast.error(`Error fixing semifinal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFixingSemi(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const grandFinalTeams = [...breakData]
    .sort((a, b) => (b.totalPoints === a.totalPoints ? b.totalTeamScore - a.totalTeamScore : b.totalPoints - a.totalPoints))
    .slice(0, 4);

  return (
    <div className="px-1 md:py-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <ChevronsUp className="text-green-600" /> Tabulation Score KEDCOMP <ChevronsDown className="text-red-600" />
      </h1>

      <Tabs defaultValue="prelim">
        <TabsList className="mb-4">
          <TabsTrigger value="prelim">Preliminary</TabsTrigger>
          <TabsTrigger value="quarter">Quarter Final</TabsTrigger>
          <TabsTrigger value="break">Semi Final</TabsTrigger>
          <TabsTrigger value="grandfinal">Grand Final</TabsTrigger>
          <TabsTrigger value="individual">Speaker</TabsTrigger>
        </TabsList>

        <TabsContent value="prelim">
          <TeamTabulationTable data={prelimData} prefix="Preliminary" />
        </TabsContent>

        <TabsContent value="quarter">
          <h2 className="text-xl font-bold mb-4">Quarter Final Bracket</h2>
          <TeamTabulationTable data={quarterData} prefix="Quarter Final" />
          
          {isAdmin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Generate Semifinal Bracket</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {quarterFinalComplete 
                      ? "Quarter final is complete. Ready to generate semifinal bracket."
                      : canGenerateSemi 
                      ? "Quarter final has scores. Bracket can be generated (rankings will be calculated automatically)."
                      : "Quarter final is not ready. Please complete all matches or add individual scores first."
                    }
                  </p>
                  {canGenerateSemi && (
                    <p className="text-xs text-blue-600 mt-1">
                      Top 8 teams globally (berdasarkan total poin dan skor) will qualify for semifinal
                    </p>
                  )}
                </div>
                
                <Button 
                  onClick={generateSemiFinal} 
                  disabled={!canGenerateSemi || semiGenerating}
                  className="ml-4"
                >
                  {semiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Semifinal Bracket'
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="break">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Semi Final Bracket</h2>
            {isAdmin && (
              <Button 
                onClick={fixSemifinal} 
                disabled={fixingSemi}
                variant="outline"
                className="ml-4"
              >
                {fixingSemi ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  'Fix Semifinal Bracket'
                )}
              </Button>
            )}
          </div>
          
          <TeamTabulationTable data={breakData} prefix="Semi Final" grandFinalTeams={grandFinalTeams} />
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleGenerateGrandFinal}
                    disabled={generatingFinal}
                    className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generatingFinal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Generate Grand Final Bracket</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <div className="mt-6 border-t pt-4 space-y-4">
            <h2 className="text-xl font-semibold mb-2">🎉 Teams Qualify for the Grand Final</h2>
            <p className="text-sm text-gray-600 mb-3">
              Top 4 teams globally (berdasarkan total poin dan skor) dari hasil semifinal
            </p>
            <ol className="list-decimal pl-6 space-y-1">
              {grandFinalTeams.map((team, i) => (
                <li key={team.teamId} className="text-lg font-medium">
                  {team.teamName} {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'}
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="grandfinal">
          <TeamTabulationTable data={grandFinalData} prefix="Grand Final" />
        </TabsContent>

        <TabsContent value="individual">
          <SpeakerTabulationTable data={individualData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==========================
// COMPONENT TABLES
// ==========================
function TeamTabulationTable({
  data,
  prefix,
  grandFinalTeams = [],
}: {
  data: TeamTabulation[];
  prefix: string;
  grandFinalTeams?: TeamTabulation[];
}) {
  const highlightIds = grandFinalTeams.map(t => t.teamId);
  const showMedals = prefix === 'Grand Final';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left border border-gray-200">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-2 border text-center">#</th>
            <th className="px-4 py-2 border">Tim</th>
            {data[0]?.rounds.map((_, i) => (
              <th key={i} className="px-4 py-2 border text-center">
                {prefix} {i + 1}
              </th>
            ))}
            <th className="px-4 py-2 border text-center">Point</th>
            <th className="px-4 py-2 border text-center">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((team, idx) => {
            const isFinalist = highlightIds.includes(team.teamId);
            const medal = showMedals
              ? idx === 0
                ? '🥇'
                : idx === 1
                ? '🥈'
                : idx === 2
                ? '🥉'
                : ''
              : '';

            return (
              <tr key={team.teamId} className={`hover:bg-gray-50 ${isFinalist ? 'bg-yellow-50 font-semibold' : ''}`}>
                <td className="px-4 py-2 border text-center">{idx + 1}</td>
                <td className="px-4 py-2 border">
                  <span className="font-medium">
                    {team.teamName} {medal}
                  </span>
                </td>
                {team.rounds.map((r, i) => (
                  <td key={i} className="px-2 py-1 border text-center leading-tight">
                    <div className="font-medium">ke-{r.rank}</div>
                    <div className="text-xs text-blue-600">{r.points} poin</div>
                  </td>
                ))}
                <td className="px-4 py-2 border text-center font-bold text-blue-700">{team.totalPoints}</td>
                <td className="px-4 py-2 border text-center">{team.totalTeamScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SpeakerTabulationTable({ data }: { data: SpeakerTabulation[] }) {
  const allRoundNames = Array.from(new Set(data.flatMap(s => s.scores.map(score => score.roundName))));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Speaker name</th>
            <th className="px-4 py-2 border">Team</th>
            {allRoundNames.map((roundName, idx) => (
              <th key={idx} className="px-4 py-2 border text-center">
                {roundName}
              </th>
            ))}
            <th className="px-4 py-2 border">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          {data.map((speaker, idx) => {
            const scoreMap = Object.fromEntries(speaker.scores.map(s => [s.roundName, s.value]));
            return (
              <tr key={speaker.speakerId} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{idx + 1}</td>
                <td className="px-4 py-2 border font-medium">{speaker.speakerName}</td>
                <td className="px-4 py-2 border">{speaker.teamName}</td>
                {allRoundNames.map((rName, i) => (
                  <td key={i} className="px-4 py-2 border text-center">{scoreMap[rName] ?? '-'}</td>
                ))}
                <td className="px-4 py-2 border text-center">{speaker.averageScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}