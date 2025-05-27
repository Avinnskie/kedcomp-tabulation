'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [teamName, setTeamName] = useState('');
  const [participant1, setParticipant1] = useState({ name: '', email: '' });
  const [participant2, setParticipant2] = useState({ name: '', email: '' });
  const [Judge, setJudge] = useState({ name: '', email: '', password: '' });
  const [roomName, setHome] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('api/teams/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamName,
        participants: [participant1, participant2],
      }),
    });

    if (res.ok) {
      alert('Team created!');
      setTeamName('');
      setParticipant1({ name: '', email: '' });
      setParticipant2({ name: '', email: '' });
    } else {
      alert('Error creating team');
    }
    setLoading(false);
  };

  const createJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/judge/create', {
      method: 'POST',
      headers: {
        'Contect-Type': 'application/json',
      },
      body: JSON.stringify(Judge),
    });
    if (res.ok) {
      alert('Judge created!');
      setJudge({ name: '', email: '', password: '' });
    } else {
      alert('Error creating judge');
    }
    setLoading(false);
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: {
        'Contecy-Type': 'application/json',
      },
      body: JSON.stringify({ name: roomName }),
    });
    if (res.ok) {
      alert('Room created!');
      setJudge({ name: '', email: '', password: '' });
    } else {
      alert('Error creating Room');
    }
    setLoading(false);
  };

  return (
    <div className="md:ml-[200px] w-full p-6 bg-white space-y-6">
      <div className="mt-5">
        <h1 className="text-2xl font-semibold mb-4">Adding new teams and their participation</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold">Team Name</label>
            <input
              type="text"
              value={teamName}
              placeholder="E.g John Doe"
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
      </div>
      <div className="mt-5">
        <h1 className="text-2xl font-semibold mb-4">Adding judges</h1>
        <form onSubmit={createJudge} className="space-y-4">
          <div>
            <label className="block font-semibold">Name</label>
            <input
              type="text"
              value={Judge.name}
              placeholder="E.g John Doe"
              onChange={e => setJudge({ ...Judge, name: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-semibold">Email</label>
            <input
              type="email"
              value={Judge.email}
              placeholder="johndoe@gmail.com"
              onChange={e => setJudge({ ...Judge, email: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-semibold">Password</label>
            <input
              type="password"
              value={Judge.password}
              placeholder="********"
              onChange={e => setJudge({ ...Judge, password: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
      <div className="mt-5">
        <h1 className="text-2xl font-semibold mb-4">Adding Rooms</h1>
        <form onSubmit={createRoom} className="space-y-4">
          <div>
            <label className="block font-semibold">Room name</label>
            <input
              type="text"
              value={roomName}
              placeholder="Ruang Kelas A"
              onChange={e => setHome(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
