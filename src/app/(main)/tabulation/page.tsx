'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronsUp, ChevronsDown, Repeat, Loader2, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [searchPrelim, setSearchPrelim] = useState('');
  const [searchQuarter, setSearchQuarter] = useState('');
  const [searchBreak, setSearchBreak] = useState('');
  const [searchGrandFinal, setSearchGrandFinal] = useState('');
  const [searchIndividual, setSearchIndividual] = useState('');

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

  // Filter functions
  const filterTeamData = (data: TeamTabulation[], search: string) => {
    if (!search.trim()) return data;
    return data.filter(team => 
      team.teamName.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filterSpeakerData = (data: SpeakerTabulation[], search: string) => {
    if (!search.trim()) return data;
    return data.filter(speaker => 
      speaker.speakerName.toLowerCase().includes(search.toLowerCase()) ||
      speaker.teamName.toLowerCase().includes(search.toLowerCase())
    );
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const grandFinalTeams = [...breakData]
    .sort((a, b) => (b.totalPoints === a.totalPoints ? b.totalTeamScore - a.totalTeamScore : b.totalPoints - a.totalPoints))
    .slice(0, 4);

  // Filtered data
  const filteredPrelimData = filterTeamData(prelimData, searchPrelim);
  const filteredQuarterData = filterTeamData(quarterData, searchQuarter);
  const filteredBreakData = filterTeamData(breakData, searchBreak);
  const filteredGrandFinalData = filterTeamData(grandFinalData, searchGrandFinal);
  const filteredIndividualData = filterSpeakerData(individualData, searchIndividual);

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 flex items-center gap-2">
        <ChevronsUp className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" /> 
        <span className="flex-1">Tabulation Score KEDCOMP</span>
        <ChevronsDown className="text-red-600 w-4 h-4 sm:w-5 sm:h-5" />
      </h1>

      <Tabs defaultValue="prelim">
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="prelim" className="text-xs sm:text-sm px-2 py-2">Preliminary</TabsTrigger>
          <TabsTrigger value="quarter" className="text-xs sm:text-sm px-2 py-2">Quarter Final</TabsTrigger>
          <TabsTrigger value="break" className="text-xs sm:text-sm px-2 py-2">Semi Final</TabsTrigger>
          <TabsTrigger value="grandfinal" className="text-xs sm:text-sm px-2 py-2">Grand Final</TabsTrigger>
          <TabsTrigger value="individual" className="text-xs sm:text-sm px-2 py-2 col-span-2 sm:col-span-1">Speaker</TabsTrigger>
        </TabsList>

        <TabsContent value="prelim">
          <div className="mb-4">
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tim..."
                value={searchPrelim}
                onChange={(e) => setSearchPrelim(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          <TeamTabulationTable data={filteredPrelimData} prefix="Preliminary" />
        </TabsContent>

        <TabsContent value="quarter">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Quarter Final Bracket</h2>
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tim..."
                value={searchQuarter}
                onChange={(e) => setSearchQuarter(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          <TeamTabulationTable data={filteredQuarterData} prefix="Quarter Final" />
          
          {isAdmin && (
            <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-lg">Generate Semifinal Bracket</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {semiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">Gen...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Generate Semifinal Bracket</span>
                      <span className="sm:hidden">Generate Semifinal</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="break">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Semi Final Bracket</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="relative w-full sm:w-auto sm:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari tim..."
                  value={searchBreak}
                  onChange={(e) => setSearchBreak(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              {isAdmin && (
                <Button 
                  onClick={fixSemifinal} 
                  disabled={fixingSemi}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {fixingSemi ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Fixing...</span>
                      <span className="sm:hidden">Fix...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Fix Semifinal Bracket</span>
                      <span className="sm:hidden">Fix Bracket</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <TeamTabulationTable data={filteredBreakData} prefix="Semi Final" grandFinalTeams={grandFinalTeams} />
          
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
            <h2 className="text-lg sm:text-xl font-semibold mb-2">🎉 Teams Qualify for the Grand Final</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Top 4 teams globally (berdasarkan total poin dan skor) dari hasil semifinal
            </p>
            <ol className="list-decimal pl-4 sm:pl-6 space-y-1">
              {grandFinalTeams.map((team, i) => (
                <li key={team.teamId} className="text-sm sm:text-lg font-medium break-words">
                  {team.teamName} {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'}
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="grandfinal">
          <div className="mb-4">
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tim..."
                value={searchGrandFinal}
                onChange={(e) => setSearchGrandFinal(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          <TeamTabulationTable data={filteredGrandFinalData} prefix="Grand Final" />
        </TabsContent>

        <TabsContent value="individual">
          <div className="mb-4">
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari speaker atau tim..."
                value={searchIndividual}
                onChange={(e) => setSearchIndividual(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          <SpeakerTabulationTable data={filteredIndividualData} />
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
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full text-xs sm:text-sm text-left border border-gray-200">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-2 sm:px-4 py-2 border text-center sticky left-0 bg-gray-100 z-10">#</th>
              <th className="px-2 sm:px-4 py-2 border sticky left-8 sm:left-12 bg-gray-100 z-10 min-w-[120px] sm:min-w-[150px]">Tim</th>
              {data[0]?.rounds.map((_, i) => (
                <th key={i} className="px-1 sm:px-2 py-2 border text-center min-w-[60px] sm:min-w-[80px]">
                  <div className="text-xs sm:text-sm">{prefix}</div>
                  <div className="text-xs">{i + 1}</div>
                </th>
              ))}
              <th className="px-2 sm:px-4 py-2 border text-center min-w-[50px]">Victory Point</th>
              <th className="px-2 sm:px-4 py-2 border text-center min-w-[50px]">Score</th>
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
                  <td className="px-2 sm:px-4 py-2 border text-center sticky left-0 bg-white z-10">{idx + 1}</td>
                  <td className="px-2 sm:px-4 py-2 border sticky left-8 sm:left-12 bg-white z-10">
                    <div className="font-medium text-xs sm:text-sm break-words">
                      {team.teamName} {medal}
                    </div>
                  </td>
                  {team.rounds.map((r, i) => (
                    <td key={i} className="px-1 sm:px-2 py-1 border text-center leading-tight">
                      <div className="font-medium text-xs">ke-{r.rank}</div>
                      <div className="text-[10px] sm:text-xs text-blue-600">{r.points}</div>
                    </td>
                  ))}
                  <td className="px-2 sm:px-4 py-2 border text-center font-bold text-blue-700 text-xs sm:text-sm">{team.totalPoints}</td>
                  <td className="px-2 sm:px-4 py-2 border text-center text-xs sm:text-sm">{team.totalTeamScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpeakerTabulationTable({ data }: { data: SpeakerTabulation[] }) {
  const allRoundNames = Array.from(new Set(data.flatMap(s => s.scores.map(score => score.roundName))));

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 sm:px-4 py-2 border sticky left-0 bg-gray-100 z-10">#</th>
              <th className="px-2 sm:px-4 py-2 border sticky left-8 sm:left-12 bg-gray-100 z-10 min-w-[120px] sm:min-w-[150px]">Speaker</th>
              <th className="px-2 sm:px-4 py-2 border sticky left-32 sm:left-40 bg-gray-100 z-10 min-w-[100px] sm:min-w-[120px]">Team</th>
              {allRoundNames.map((roundName, idx) => (
                <th key={idx} className="px-1 sm:px-2 py-2 border text-center min-w-[60px] text-xs sm:text-sm">
                  {roundName}
                </th>
              ))}
              <th className="px-2 sm:px-4 py-2 border text-center min-w-[60px]">Avg</th>
            </tr>
          </thead>
          <tbody>
            {data.map((speaker, idx) => {
              const scoreMap = Object.fromEntries(speaker.scores.map(s => [s.roundName, s.value]));
              return (
                <tr key={speaker.speakerId} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-2 border text-center sticky left-0 bg-white z-10">{idx + 1}</td>
                  <td className="px-2 sm:px-4 py-2 border font-medium sticky left-8 sm:left-12 bg-white z-10">
                    <div className="text-xs sm:text-sm break-words">{speaker.speakerName}</div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 border sticky left-32 sm:left-40 bg-white z-10">
                    <div className="text-xs sm:text-sm break-words">{speaker.teamName}</div>
                  </td>
                  {allRoundNames.map((rName, i) => (
                    <td key={i} className="px-1 sm:px-2 py-2 border text-center text-xs sm:text-sm">{scoreMap[rName] ?? '-'}</td>
                  ))}
                  <td className="px-2 sm:px-4 py-2 border text-center font-semibold text-xs sm:text-sm">{speaker.averageScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}