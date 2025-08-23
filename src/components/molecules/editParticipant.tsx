'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

type Participant = {
  id: number;
  name: string;
  email: string;
  teamId: number;
  teamName: string;
};

type Team = {
  id: number;
  name: string;
};

type ApiResponse = {
  participants: Participant[];
  teams: Team[];
};

export default function EditParticipant() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    teamId: ''
  });
  
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    teamId: ''
  });

  // Filter states
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/participants');
      const result: ApiResponse = await response.json();
      
      if (response.ok) {
        setData(result);
      } else {
        toast.error('Gagal memuat data participant');
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditForm({
      name: participant.name,
      email: participant.email,
      teamId: participant.teamId.toString()
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', email: '', teamId: '' });
  };

  const updateParticipant = async (participantId: number) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/participants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          name: editForm.name,
          email: editForm.email,
          teamId: editForm.teamId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Participant berhasil diupdate: ${result.participant.name}`);
        await fetchData(); // Refresh data
        cancelEdit();
      } else {
        toast.error(result.error || 'Gagal mengupdate participant');
      }
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Terjadi kesalahan saat mengupdate participant');
    } finally {
      setUpdating(false);
    }
  };

  const deleteParticipant = async (participant: Participant) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${participant.name}?`)) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/participants?participantId=${participant.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Participant berhasil dihapus: ${result.deletedParticipant.name}`);
        await fetchData(); // Refresh data
      } else {
        toast.error(result.error || 'Gagal menghapus participant');
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
      toast.error('Terjadi kesalahan saat menghapus participant');
    } finally {
      setUpdating(false);
    }
  };

  const addParticipant = async () => {
    if (!addForm.name || !addForm.email || !addForm.teamId) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          teamId: addForm.teamId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Participant berhasil ditambahkan: ${result.participant.name}`);
        await fetchData(); // Refresh data
        setAddForm({ name: '', email: '', teamId: '' });
        setShowAddForm(false);
      } else {
        toast.error(result.error || 'Gagal menambahkan participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Terjadi kesalahan saat menambahkan participant');
    } finally {
      setUpdating(false);
    }
  };

  // Filter participants
  const filteredParticipants = data?.participants.filter(participant => {
    const matchesTeam = selectedTeam ? participant.teamId === selectedTeam : true;
    const matchesSearch = searchQuery ? 
      participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.teamName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesTeam && matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Gagal memuat data. Silakan coba lagi.</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Edit Participant</h1>
        <p className="text-gray-600">Kelola participant: tambah, edit, hapus, dan pindahkan antar team</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Cari participant atau team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Team Filter */}
          <select
            value={selectedTeam || ''}
            onChange={(e) => setSelectedTeam(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Team</option>
            {data.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Plus size={16} />
          Add Participant
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Tambah Participant Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nama"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={addForm.teamId}
              onChange={(e) => setAddForm({ ...addForm, teamId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Team</option>
              {data.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addParticipant}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Save size={16} />
              {updating ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({ name: '', email: '', teamId: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <X size={16} />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          Total: {filteredParticipants.length} participant
          {selectedTeam && ` dari team ${data.teams.find(t => t.id === selectedTeam)?.name}`}
          {searchQuery && ` yang cocok dengan "${searchQuery}"`}
        </p>
      </div>

      {/* Participants Table */}
      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {selectedTeam || searchQuery ? 'Tidak ada participant yang cocok dengan filter' : 'Tidak ada participant tersedia'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Team</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm border-b">
                    {editingId === participant.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-medium">{participant.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {editingId === participant.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-600">{participant.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {editingId === participant.id ? (
                      <select
                        value={editForm.teamId}
                        onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {data.teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {participant.teamName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <div className="flex items-center gap-2">
                      {editingId === participant.id ? (
                        <>
                          <button
                            onClick={() => updateParticipant(participant.id)}
                            disabled={updating}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            <Save size={12} />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(participant)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteParticipant(participant)}
                            disabled={updating}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-400"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
