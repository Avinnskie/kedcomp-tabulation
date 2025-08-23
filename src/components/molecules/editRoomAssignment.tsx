'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Assignment = {
  id: number;
  roundId: number;
  roundName: string;
  roundNumber: number;
  roomId: number;
  roomName: string;
  judgeId: number | null;
  judgeName: string | null;
  judgeEmail: string | null;
  teams: {
    teamId: number;
    teamName: string;
    position: string;
  }[];
};

type Round = {
  id: number;
  name: string;
  number: number;
};

type Judge = {
  id: number;
  name: string;
  email: string;
};

type Room = {
  id: number;
  name: string;
};

type ApiResponse = {
  assignments: Assignment[];
  rounds: Round[];
  judges: Judge[];
  rooms: Room[];
};

export default function EditRoomAssignment() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Filter assignments when round is selected
  useEffect(() => {
    if (selectedRoundId && data) {
      fetchAssignmentsByRound(selectedRoundId);
    } else if (data) {
      setAssignments(data.assignments);
    }
  }, [selectedRoundId, data]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/edit-assignment');
      const result: ApiResponse = await response.json();
      
      if (response.ok) {
        setData(result);
        setAssignments(result.assignments);
      } else {
        toast.error('Gagal memuat data assignment');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsByRound = async (roundId: number) => {
    try {
      const response = await fetch(`/api/admin/edit-assignment?roundId=${roundId}`);
      const result: ApiResponse = await response.json();
      
      if (response.ok) {
        setAssignments(result.assignments);
      } else {
        toast.error('Gagal memuat assignment untuk round tersebut');
      }
    } catch (error) {
      console.error('Error fetching assignments by round:', error);
      toast.error('Terjadi kesalahan saat memuat assignment');
    }
  };

  const updateAssignment = async (assignmentId: number, roomId: number, judgeId: number | null) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/edit-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          roomId,
          judgeId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Assignment berhasil diupdate: ${result.assignment.roomName} - ${result.assignment.judgeName || 'Tanpa juri'}`);
        
        // Update local state
        setAssignments(prev => 
          prev.map(a => 
            a.id === assignmentId
              ? {
                  ...a,
                  roomId,
                  roomName: data?.rooms.find(r => r.id === roomId)?.name || a.roomName,
                  judgeId,
                  judgeName: judgeId ? data?.judges.find(j => j.id === judgeId)?.name || null : null,
                  judgeEmail: judgeId ? data?.judges.find(j => j.id === judgeId)?.email || null : null,
                }
              : a
          )
        );
      } else {
        toast.error(result.error || 'Gagal mengupdate assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Terjadi kesalahan saat mengupdate assignment');
    } finally {
      setUpdating(false);
    }
  };

  const bulkUpdateAssignments = async () => {
    try {
      setUpdating(true);
      const updatesData = assignments.map(a => ({
        assignmentId: a.id,
        roomId: a.roomId,
        judgeId: a.judgeId,
      }));

      const response = await fetch('/api/admin/edit-assignment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatesData),
      });

      const result = await response.json();

      if (response.ok) {
        const successful = result.results.filter((r: any) => r.success).length;
        const failed = result.results.filter((r: any) => !r.success).length;
        
        if (failed === 0) {
          toast.success(`Semua ${successful} assignment berhasil diupdate`);
        } else {
          toast.warning(`${successful} assignment berhasil, ${failed} gagal diupdate`);
        }
        
        // Refresh data
        await fetchData();
      } else {
        toast.error(result.error || 'Gagal melakukan bulk update');
      }
    } catch (error) {
      console.error('Error bulk updating assignments:', error);
      toast.error('Terjadi kesalahan saat melakukan bulk update');
    } finally {
      setUpdating(false);
    }
  };

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
        <h1 className="text-2xl font-bold mb-2">Edit Room Assignment</h1>
        <p className="text-gray-600">Kelola assignment room dan juri untuk setiap ronde</p>
      </div>

      {/* Round Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Filter by Round</label>
        <select
          value={selectedRoundId || ''}
          onChange={(e) => setSelectedRoundId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Round</option>
          {data.rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name} (Round {round.number})
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Update Button */}
      {assignments.length > 0 && (
        <div className="flex gap-4">
          <button
            onClick={bulkUpdateAssignments}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {updating ? 'Mengupdate...' : 'Simpan Semua Perubahan'}
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      )}

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {selectedRoundId ? 'Tidak ada assignment untuk round ini' : 'Tidak ada assignment tersedia'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Round</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Room</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Judge</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Teams</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm border-b">
                    <div>
                      <div className="font-medium">{assignment.roundName}</div>
                      <div className="text-gray-500">Round {assignment.roundNumber}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <select
                      value={assignment.roomId}
                      onChange={(e) => {
                        const newRoomId = parseInt(e.target.value);
                        setAssignments(prev => 
                          prev.map(a => 
                            a.id === assignment.id 
                              ? { ...a, roomId: newRoomId, roomName: data.rooms.find(r => r.id === newRoomId)?.name || '' }
                              : a
                          )
                        );
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {data.rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <select
                      value={assignment.judgeId || ''}
                      onChange={(e) => {
                        const newJudgeId = e.target.value ? parseInt(e.target.value) : null;
                        const judge = newJudgeId ? data.judges.find(j => j.id === newJudgeId) : null;
                        setAssignments(prev => 
                          prev.map(a => 
                            a.id === assignment.id 
                              ? { 
                                  ...a, 
                                  judgeId: newJudgeId,
                                  judgeName: judge?.name || null,
                                  judgeEmail: judge?.email || null
                                }
                              : a
                          )
                        );
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Juri</option>
                      {data.judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.name} ({judge.email})
                        </option>
                      ))}
                    </select>
                    {assignment.judgeName && (
                      <div className="text-xs text-gray-500 mt-1">
                        Current: {assignment.judgeName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <div className="space-y-1">
                      {assignment.teams.map((team) => (
                        <div key={team.teamId} className="text-xs">
                          <span className="font-medium">{team.position}:</span> {team.teamName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <button
                      onClick={() => updateAssignment(assignment.id, assignment.roomId, assignment.judgeId)}
                      disabled={updating}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {updating ? 'Updating...' : 'Update'}
                    </button>
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
