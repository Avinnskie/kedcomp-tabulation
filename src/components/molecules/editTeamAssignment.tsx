'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Users, ArrowLeftRight, Edit2, Save, X } from 'lucide-react';

type Participant = {
  id: number;
  name: string;
  email: string;
};

type Team = {
  id: number;
  name: string;
  participants: Participant[];
};

type TeamAssignment = {
  id: number;
  teamId: number;
  teamName: string;
  position: string;
  roundAssignmentId: number;
  roundId: number;
  roundName: string;
  roundNumber: number;
  roomId: number;
  roomName: string;
  judgeId: number | null;
  judgeName: string | null;
  participants: Participant[];
};

type Round = {
  id: number;
  name: string;
  number: number;
};

type ApiResponse = {
  teamAssignments: TeamAssignment[];
  rounds: Round[];
  teams: Team[];
};

const positionColors = {
  'OG': 'bg-green-100 text-green-800',
  'OO': 'bg-blue-100 text-blue-800',
  'CG': 'bg-orange-100 text-orange-800',
  'CO': 'bg-red-100 text-red-800',
};

const positionNames = {
  'OG': 'Opening Government',
  'OO': 'Opening Opposition',
  'CG': 'Closing Government',
  'CO': 'Closing Opposition',
};

export default function EditTeamAssignment() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [firstSwapId, setFirstSwapId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoundId && data) {
      fetchAssignmentsByRound(selectedRoundId);
    } else if (data) {
      // Show all if no round selected
      fetchData();
    }
  }, [selectedRoundId, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/team-assignment');
      const result: ApiResponse = await response.json();
      
      if (response.ok) {
        setData(result);
      } else {
        toast.error('Gagal memuat data team assignment');
      }
    } catch (error) {
      console.error('Error fetching team assignments:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsByRound = async (roundId: number) => {
    try {
      const response = await fetch(`/api/admin/team-assignment?roundId=${roundId}`);
      const result: ApiResponse = await response.json();
      
      if (response.ok) {
        setData(prev => prev ? { ...prev, teamAssignments: result.teamAssignments } : result);
      } else {
        toast.error('Gagal memuat assignment untuk round tersebut');
      }
    } catch (error) {
      console.error('Error fetching assignments by round:', error);
      toast.error('Terjadi kesalahan saat memuat assignment');
    }
  };

  const startEdit = (assignment: TeamAssignment) => {
    setEditingId(assignment.id);
    setSelectedTeamId(assignment.teamId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedTeamId(null);
  };

  const updateTeamAssignment = async (assignmentId: number, newTeamId: number) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/team-assignment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamAssignmentId: assignmentId,
          newTeamId: newTeamId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Team berhasil diupdate: ${result.assignment.teamName} di posisi ${result.assignment.position}`);
        await fetchData(); // Refresh data
        cancelEdit();
      } else {
        toast.error(result.error || 'Gagal mengupdate team assignment');
      }
    } catch (error) {
      console.error('Error updating team assignment:', error);
      toast.error('Terjadi kesalahan saat mengupdate assignment');
    } finally {
      setUpdating(false);
    }
  };

  const handleSwapClick = (assignmentId: number) => {
    if (!swapMode) {
      setSwapMode(true);
      setFirstSwapId(assignmentId);
      toast.info('Mode swap aktif. Pilih assignment kedua untuk di-swap.');
    } else if (firstSwapId === assignmentId) {
      // Cancel swap mode
      setSwapMode(false);
      setFirstSwapId(null);
      toast.info('Mode swap dibatalkan.');
    } else {
      // Perform swap
      performSwap(firstSwapId!, assignmentId);
    }
  };

  const performSwap = async (assignment1Id: number, assignment2Id: number) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/team-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment1Id,
          assignment2Id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Teams berhasil di-swap!');
        await fetchData(); // Refresh data
        setSwapMode(false);
        setFirstSwapId(null);
      } else {
        toast.error(result.error || 'Gagal melakukan swap');
      }
    } catch (error) {
      console.error('Error swapping teams:', error);
      toast.error('Terjadi kesalahan saat melakukan swap');
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableTeams = (currentTeamId: number, roundId: number) => {
    if (!data) return [];

    // Get teams already assigned to this round (excluding current assignment)
    const assignedTeamIds = data.teamAssignments
      .filter(ta => ta.roundId === roundId && ta.teamId !== currentTeamId)
      .map(ta => ta.teamId);

    // Return teams not assigned to this round + teams from other rounds
    return data.teams.filter(team => !assignedTeamIds.includes(team.id));
  };

  const getTeamWithAssignmentInfo = (team: Team, roundId: number, currentAssignmentId: number) => {
    // Check if team is assigned in current round
    const assignmentInCurrentRound = data?.teamAssignments.find(
      ta => ta.teamId === team.id && ta.roundId === roundId && ta.id !== currentAssignmentId
    );

    if (assignmentInCurrentRound) {
      return {
        ...team,
        displayName: `${team.name} (Already in ${assignmentInCurrentRound.roomName} - ${assignmentInCurrentRound.position})`,
        isConflict: true,
        isFromOtherRound: false,
      };
    }

    // Check if team is assigned in other rounds
    const assignmentInOtherRound = data?.teamAssignments.find(
      ta => ta.teamId === team.id && ta.roundId !== roundId
    );

    if (assignmentInOtherRound) {
      return {
        ...team,
        displayName: `${team.name} (From ${assignmentInOtherRound.roundName} - ${assignmentInOtherRound.roomName})`,
        isFromOtherRound: true,
        isConflict: false,
      };
    }

    return {
      ...team,
      displayName: team.name,
      isAvailable: true,
      isConflict: false,
      isFromOtherRound: false,
    };
  };

  const groupedAssignments = data?.teamAssignments.reduce((acc, assignment) => {
    const key = `${assignment.roundName} - ${assignment.roomName}`;
    if (!acc[key]) {
      acc[key] = {
        roundName: assignment.roundName,
        roomName: assignment.roomName,
        judgeName: assignment.judgeName,
        roundNumber: assignment.roundNumber,
        assignments: []
      };
    }
    acc[key].assignments.push(assignment);
    return acc;
  }, {} as Record<string, any>) || {};

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 rounded w-full"></div>
            <div className="h-20 bg-gray-300 rounded w-full"></div>
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
        <h1 className="text-2xl font-bold mb-2">Edit Team Assignment</h1>
        <p className="text-gray-600 mb-4">Kelola assignment team di setiap room dan round. Switch team atau swap position antar team.</p>
        
        {/* Feature Info */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 Fitur Cross-Room Assignment</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Pindahkan tim dari room lain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Swap tim antar room & position</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Edit team dalam room yang sama</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Validasi otomatis untuk menghindari duplikasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Round Filter */}
          <select
            value={selectedRoundId || ''}
            onChange={(e) => setSelectedRoundId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Round</option>
            {data.rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name} (Round {round.number})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {swapMode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-800 rounded text-sm">
              <ArrowLeftRight size={16} />
              Mode Swap Aktif
              <button
                onClick={() => {
                  setSwapMode(false);
                  setFirstSwapId(null);
                }}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <button
            onClick={fetchData}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {data.teamAssignments.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Total: {data.teamAssignments.length} assignments
            {selectedRoundId && ` untuk ${data.rounds.find(r => r.id === selectedRoundId)?.name}`}
            {swapMode && ' - Klik assignment untuk swap'}
          </p>
        </div>
      )}

      {/* Team Assignments */}
      {Object.keys(groupedAssignments).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {selectedRoundId ? 'Tidak ada assignment untuk round ini' : 'Tidak ada assignment tersedia'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAssignments).map(([key, room]) => (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{room.roundName}</h3>
                    <p className="text-sm text-gray-600">
                      {room.roomName} • Judge: {room.judgeName || 'Tidak ada'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={16} />
                    {room.assignments.length} teams
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {room.assignments.map((assignment: TeamAssignment) => (
                    <div
                      key={assignment.id}
                      className={`border rounded-lg p-4 transition-all ${
                        swapMode && firstSwapId === assignment.id
                          ? 'border-orange-400 bg-orange-50 shadow-md'
                          : swapMode
                          ? 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                          : 'border-gray-300 bg-white'
                      }`}
                      onClick={() => swapMode && handleSwapClick(assignment.id)}
                    >
                      {/* Position Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          positionColors[assignment.position as keyof typeof positionColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.position}
                        </span>
                        
                        {!swapMode && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSwapClick(assignment.id)}
                              className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Swap dengan team lain"
                            >
                              <ArrowLeftRight size={14} />
                            </button>
                            {editingId !== assignment.id && (
                              <button
                                onClick={() => startEdit(assignment)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit team"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Team Selection or Display */}
                      {editingId === assignment.id ? (
                        <div className="space-y-3">
                          <select
                            value={selectedTeamId || ''}
                            onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={assignment.teamId}>{assignment.teamName} (Current)</option>
                            {getAvailableTeams(assignment.teamId, assignment.roundId).map((team) => {
                              const teamInfo = getTeamWithAssignmentInfo(team, assignment.roundId, assignment.id);
                              return (
                                <option 
                                  key={team.id} 
                                  value={team.id}
                                  disabled={teamInfo.isConflict}
                                  style={{
                                    color: teamInfo.isConflict ? '#ef4444' : teamInfo.isFromOtherRound ? '#f59e0b' : '#000'
                                  }}
                                >
                                  {teamInfo.displayName}
                                </option>
                              );
                            })}
                          </select>
                          
                          {/* Helper Text */}
                          <div className="text-xs text-gray-500 mt-1">
                            💡 Tip: Tim dari room lain akan dipindahkan ke sini
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectedTeamId && updateTeamAssignment(assignment.id, selectedTeamId)}
                              disabled={updating || !selectedTeamId || selectedTeamId === assignment.teamId}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                            >
                              <Save size={12} />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Team Name */}
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {assignment.teamName}
                          </h4>
                          
                          {/* Participants */}
                          <div className="space-y-1">
                            {assignment.participants.map((participant) => (
                              <div key={participant.id} className="text-sm text-gray-600">
                                {participant.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Position Description */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {positionNames[assignment.position as keyof typeof positionNames]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
