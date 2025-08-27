'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Save, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const [teamScores, setTeamScores] = useState<Record<number, string>>({});
  const [individualScores, setIndividualScores] = useState<Record<number, Record<number, string>>>(
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

  const validateTeamScore = (score: string) => {
    if (score === '') return true; // Allow empty
    const num = Number(score);
    return !isNaN(num) && num >= 0 && num <= 3; // ✅ max 3
  };

  const validateIndividualScore = (score: string) => {
    if (score === '') return true; // Allow empty
    const num = Number(score);
    return !isNaN(num) && num >= 0 && num <= 86; // ✅ max 86
  };

  const isFormValid = () => {
    // Check if all required fields are filled and valid
    for (const team of data?.teamAssignments || []) {
      const teamScore = teamScores[team.team.id];
      if (!teamScore || !validateTeamScore(teamScore)) {
        return false;
      }

      for (const participant of team.team.participants) {
        const individualScore = individualScores[team.team.id]?.[participant.id];
        if (!individualScore || !validateIndividualScore(individualScore)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fill all scores with valid values.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roundAssignmentId: Number(id),
        teamScores: Object.entries(teamScores).map(([teamId, value]) => ({
          teamId: Number(teamId),
          value: Number(value),
        })),
        individualScores: Object.entries(individualScores).flatMap(([teamId, scores]) =>
          Object.entries(scores).map(([participantId, value]) => ({
            teamId: Number(teamId),
            participantId: Number(participantId),
            value: Number(value),
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
        toast.success('Scores submitted successfully!');
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

  // Helper function to get position color
  const getPositionColor = (position: string) => {
    const colors = {
      OG: 'bg-blue-100 text-blue-800 border-blue-300',
      OO: 'bg-green-100 text-green-800 border-green-300',
      CG: 'bg-orange-100 text-orange-800 border-orange-300',
      CO: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="h-20 bg-gray-200"></CardHeader>
              <CardContent className="h-32 bg-gray-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data found or you are not authorized to access this round.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Judge Scoring Panel</h1>
        <div className="flex items-center justify-center space-x-2 text-lg">
          <Badge variant="outline" className="text-base px-3 py-1">
            {data.round.name}
          </Badge>
          <span className="text-gray-500">•</span>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {data.room.name}
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Please score each team and individual participant. Team scores range from 0-100,
          individual scores range from 0-50.
        </AlertDescription>
      </Alert>

      {/* Scoring Forms */}
      <div className="space-y-6">
        {data.teamAssignments.map(({ team, position }) => {
          const teamScore = teamScores[team.id] ?? '';
          const teamScoreValid = validateTeamScore(teamScore);

          return (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className={`${getPositionColor(position)} border-b`}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getPositionColor(position)} border`}>{position}</Badge>
                    <span className="text-xl font-bold">{team.name}</span>
                  </div>
                  <div className="text-sm font-normal opacity-75">
                    {team.participants.length} participants
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Team Score */}
                <div className="space-y-2">
                  <Label htmlFor={`team-score-${team.id}`} className="text-base font-semibold">
                    Team Score (0-100 points)
                  </Label>
                  <div className="relative">
                    <Input
                      id={`team-score-${team.id}`}
                      type="number"
                      min="0"
                      max="3"
                      placeholder="Enter team score..."
                      value={teamScore}
                      onChange={e =>
                        setTeamScores({
                          ...teamScores,
                          [team.id]: e.target.value,
                        })
                      }
                      className={`text-lg h-12 ${!teamScoreValid && teamScore !== '' ? 'border-red-500' : ''}`}
                    />
                    {teamScore && teamScoreValid && (
                      <CheckCircle2 className="absolute right-3 top-3 h-6 w-6 text-green-500" />
                    )}
                    {teamScore && !teamScoreValid && (
                      <AlertCircle className="absolute right-3 top-3 h-6 w-6 text-red-500" />
                    )}
                  </div>
                  {teamScore && !teamScoreValid && (
                    <p className="text-sm text-red-600">
                      Please enter a valid score between 0 and 100
                    </p>
                  )}
                </div>

                <Separator />

                {/* Individual Scores */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Individual Scores (0-50 points each)</span>
                  </Label>

                  <div className="grid gap-4 md:grid-cols-2">
                    {team.participants.map(participant => {
                      const score = individualScores[team.id]?.[participant.id] ?? '';
                      const scoreValid = validateIndividualScore(score);

                      return (
                        <div key={participant.id} className="space-y-2">
                          <Label
                            htmlFor={`individual-score-${participant.id}`}
                            className="text-sm font-medium"
                          >
                            {participant.name}
                          </Label>
                          <div className="relative">
                            <Input
                              id={`individual-score-${participant.id}`}
                              type="number"
                              min="0"
                              max="86"
                              placeholder="0-86"
                              value={score}
                              onChange={e =>
                                setIndividualScores(prev => ({
                                  ...prev,
                                  [team.id]: {
                                    ...(prev[team.id] || {}),
                                    [participant.id]: e.target.value,
                                  },
                                }))
                              }
                              className={`${!scoreValid && score !== '' ? 'border-red-500' : ''}`}
                            />
                            {score && scoreValid && (
                              <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                            )}
                            {score && !scoreValid && (
                              <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {score && !scoreValid && (
                            <p className="text-xs text-red-600">Score must be between 0 and 50</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !isFormValid()}
          size="lg"
          className="w-full max-w-md h-12 text-lg font-semibold"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting Scores...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Submit All Scores
            </>
          )}
        </Button>
      </div>

      {/* Form Status */}
      {!isFormValid() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please fill in all required scores before submitting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
