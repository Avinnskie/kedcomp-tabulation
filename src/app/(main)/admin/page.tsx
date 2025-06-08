'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminPage() {
  const [teamName, setTeamName] = useState('');
  const [participant1, setParticipant1] = useState({ name: '', email: '' });
  const [participant2, setParticipant2] = useState({ name: '', email: '' });

  const [judge, setJudge] = useState({ name: '', email: '', password: '' });
  const [roomName, setRoomName] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    setLoading(false);
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    setLoading(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    setLoading(false);
  };

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="team">Create Team</TabsTrigger>
          <TabsTrigger value="judge">Add Judge</TabsTrigger>
          <TabsTrigger value="room">Add Room</TabsTrigger>
        </TabsList>

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
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Create Team'}
            </button>
          </form>
        </TabsContent>

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
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Create Judge'}
            </button>
          </form>
        </TabsContent>

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
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Create Room'}
            </button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
