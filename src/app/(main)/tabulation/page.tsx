'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronsUp, ChevronsDown, Repeat, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface RoundData {
  roundId: number;
  roundName: string;
  number: number;
}

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
  const [breakData, setBreakData] = useState<TeamTabulation[]>([]);
  const [individualData, setIndividualData] = useState<SpeakerTabulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [finalGenerated, setFinalGenerated] = useState(false);
  const [grandFinalData, setGrandFinalData] = useState<TeamTabulation[]>([]);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleGenerateGrandFinal = async () => {
    setGeneratingFinal(true);
    try {
      const res = await fetch('/api/break/generate-grandfinal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Successfully generated the Grand Final bracket!');
      setFinalGenerated(true);
    } catch (err) {
      toast.error(`Failed to generate grand final ${err}`);
    } finally {
      setGeneratingFinal(false);
    }
  };

  useEffect(() => {
    fetch('/api/tabulation')
      .then(res => res.json())
      .then(json => {
        setPrelimData(json.teamTabulationPrelim || []);
        setBreakData(json.teamTabulationBreak || []);
        setGrandFinalData(json.teamTabulationGrandFinal || []);
        const sorted = (json.individualTabulation || []).sort(
          (a: SpeakerTabulation, b: SpeakerTabulation) => b.averageScore - a.averageScore
        );
        setIndividualData(sorted);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  const grandFinalTeams = [...breakData]
    .sort((a, b) => {
      if (b.totalPoints === a.totalPoints) {
        return b.totalTeamScore - a.totalTeamScore;
      }
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, 4);

  return (
    <div className="px-1 md:py-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <ChevronsUp className="text-green-600" />
        Tabulation Score KEDCOMP
        <ChevronsDown className="text-red-600" />
      </h1>

      <Tabs defaultValue="prelim">
        <TabsList className="mb-4">
          <TabsTrigger value="prelim">Preliminary</TabsTrigger>
          <TabsTrigger value="break">Semi Final</TabsTrigger>
          <TabsTrigger value="grandfinal">Grand Final</TabsTrigger>
          <TabsTrigger value="individual">Speaker</TabsTrigger>
        </TabsList>

        <TabsContent value="prelim">
          <TeamTabulationTable data={prelimData} prefix="Preliminary" />
        </TabsContent>

        <TabsContent value="break">
          <TeamTabulationTable data={breakData} prefix="Break" grandFinalTeams={grandFinalTeams} />

          <div className="mt-6 border-t pt-4 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">🎉 Teams Qualify for the Grand Final</h2>
              <ol className="list-decimal pl-6 space-y-1">
                {grandFinalTeams.map((team, i) => (
                  <li key={team.teamId} className="text-lg font-medium">
                    {team.teamName} {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'}
                  </li>
                ))}
              </ol>
            </div>

            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleGenerateGrandFinal}
                      disabled={generatingFinal}
                      className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {generatingFinal ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Repeat className="w-5 h-5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Generate Grand Final Bracket</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
              <tr
                key={team.teamId}
                className={`hover:bg-gray-50 ${isFinalist ? 'bg-yellow-50 font-semibold' : ''}`}
              >
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
                <td className="px-4 py-2 border text-center font-bold text-blue-700">
                  {team.totalPoints}
                </td>
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
  // Ambil semua roundId unik
  const allRoundIds = Array.from(new Set(data.flatMap(s => s.scores.map(score => score.roundId))));
  const totalRounds = allRoundIds.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Speaker name</th>
            <th className="px-4 py-2 border">Team</th>
            {Array.from(new Set(data.flatMap(s => s.scores.map(score => score.roundName)))).map(
              (roundName, idx) => (
                <th key={idx} className="px-4 py-2 border text-center">
                  {roundName}
                </th>
              )
            )}
            <th className="px-4 py-2 border">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          {data.map((speaker, idx) => {
            const scoreMap = Object.fromEntries(speaker.scores.map(s => [s.roundName, s.value]));

            // validasi best speaker hanya jika semua ronde telah selesai (5 roundId)
            const uniqueRounds = new Set(speaker.scores.map(s => s.roundId));
            const isBestSpeaker = idx === 0 && uniqueRounds.size === totalRounds;

            return (
              <tr key={`${speaker.speakerId}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{idx + 1}</td>
                <td className="px-4 py-2 border font-medium">
                  {speaker.speakerName} {isBestSpeaker && '🎖️'}
                </td>
                <td className="px-4 py-2 border">{speaker.teamName}</td>
                {Array.from(new Set(data.flatMap(s => s.scores.map(score => score.roundName)))).map(
                  (roundName, i) => (
                    <td key={i} className="px-4 py-2 border text-center">
                      {scoreMap[roundName] ?? '-'}
                    </td>
                  )
                )}
                <td className="px-4 py-2 border text-center">{speaker.averageScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
