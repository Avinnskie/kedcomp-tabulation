'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminPage() {
  const [teamName, setTeamName] = useState('');
  const [participant1, setParticipant1] = useState({ name: '', email: '' });
  const [participant2, setParticipant2] = useState({ name: '', email: '' });

  const [judge, setJudge] = useState({ name: '', email: '', password: '' });
  const [roomName, setRoomName] = useState('');

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingJudge, setLoadingJudge] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);

  const [rounds, setRounds] = useState<any[]>([]);
  const [motionState, setMotionState] = useState<Record<number, string>>({});
  const [descriptionState, setDescriptionState] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch('/api/getBracket')
      .then(res => res.json())
      .then(data => {
        setRounds(data.rounds);

        const motions: Record<number, string> = {};
        const descriptions: Record<number, string> = {};

        data.rounds.forEach((r: any) => {
          motions[r.id] = r.motion || '';
          descriptions[r.id] = r.description || '';
        });

        setMotionState(motions);
        setDescriptionState(descriptions);
      });
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTeam(true);

    const res = await fetch('/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName,
        participants: [participant1, participant2],
      }),
    });

    const result = await res.json();

    if (res.ok) {
      toast.success('Team created successfully.');
      setTeamName('');
      setParticipant1({ name: '', email: '' });
      setParticipant2({ name: '', email: '' });
    } else {
      toast.error(result.message || 'Failed to create team.');
    }

    setLoadingTeam(false);
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingJudge(true);

    const res = await fetch('/api/judge/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(judge),
    });

    const result = await res.json();

    if (res.ok) {
      toast.success('Judge created successfully.');
      setJudge({ name: '', email: '', password: '' });
    } else {
      toast.error(result.message || 'Failed to create judge.');
    }

    setLoadingJudge(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRoom(true);

    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName }),
    });

    const result = await res.json();

    if (res.ok) {
      toast.success('Room created successfully.');
      setRoomName('');
    } else {
      toast.error(result.message || 'Failed to create room.');
    }

    setLoadingRoom(false);
  };

  const handleSaveMotion = async (roundId: number) => {
    const motion = motionState[roundId] || '';
    const description = descriptionState[roundId] || '';

    const res = await fetch(`/api/admin/round/${roundId}/motion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motion, description }),
    });

    const result = await res.json();

    if (res.ok) {
      toast.success('Motion updated!');
    } else {
      toast.error(result.message || 'Failed to update motion.');
    }
  };

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="team">Add Team</TabsTrigger>
          <TabsTrigger value="judge">Add Judge</TabsTrigger>
          <TabsTrigger value="room">Add Room</TabsTrigger>
          <TabsTrigger value="motion">Edit Motion</TabsTrigger>
        </TabsList>

        {/* Create Team Tab */}
        <TabsContent value="team">
          <h1 className="text-xl font-semibold mb-4">Create a New Team</h1>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block font-semibold">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            {[participant1, participant2].map((p, index) => (
              <div key={index} className="space-y-2">
                <h2 className="font-medium">Participant {index + 1}</h2>
                <input
                  type="text"
                  placeholder="Name"
                  value={index === 0 ? participant1.name : participant2.name}
                  onChange={e =>
                    index === 0
                      ? setParticipant1({ ...participant1, name: e.target.value })
                      : setParticipant2({ ...participant2, name: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={index === 0 ? participant1.email : participant2.email}
                  onChange={e =>
                    index === 0
                      ? setParticipant1({ ...participant1, email: e.target.value })
                      : setParticipant2({ ...participant2, email: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loadingTeam}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loadingTeam ? 'Saving...' : 'Create Team'}
            </button>
          </form>
        </TabsContent>

        {/* Add Judge Tab */}
        <TabsContent value="judge">
          <h1 className="text-xl font-semibold mb-4">Add a Judge</h1>
          <form onSubmit={handleCreateJudge} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={judge.name}
              onChange={e => setJudge({ ...judge, name: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={judge.email}
              onChange={e => setJudge({ ...judge, email: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={judge.password}
              onChange={e => setJudge({ ...judge, password: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
            <button
              type="submit"
              disabled={loadingJudge}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loadingJudge ? 'Saving...' : 'Add Judge'}
            </button>
          </form>
        </TabsContent>

        {/* Add Room Tab */}
        <TabsContent value="room">
          <h1 className="text-xl font-semibold mb-4">Add a Room</h1>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button
              type="submit"
              disabled={loadingRoom}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loadingRoom ? 'Saving...' : 'Add Room'}
            </button>
          </form>
        </TabsContent>

        {/* Edit Motion Tab */}
        <TabsContent value="motion">
          <h1 className="text-xl font-semibold mb-4">Edit Motion</h1>
          {rounds.length === 0 ? (
            <p className="text-gray-500">No rounds available. Please generate brackets first.</p>
          ) : (
            <div className="space-y-6">
              {rounds.map(round => (
                <div key={round.id} className="border p-4 rounded space-y-3">
                  <h2 className="font-semibold">{round.name}</h2>

                  <div>
                    <label className="block text-sm font-medium">Motion Title</label>
                    <textarea
                      value={motionState[round.id] || ''}
                      onChange={e =>
                        setMotionState(prev => ({ ...prev, [round.id]: e.target.value }))
                      }
                      onBlur={() => handleSaveMotion(round.id)}
                      placeholder="Enter motion title..."
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Motion Explanation</label>
                    <textarea
                      value={descriptionState[round.id] || ''}
                      onChange={e =>
                        setDescriptionState(prev => ({ ...prev, [round.id]: e.target.value }))
                      }
                      onBlur={() => handleSaveMotion(round.id)}
                      placeholder="Enter motion explanation..."
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div className="text-sm text-gray-500">Auto-save on blur</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
