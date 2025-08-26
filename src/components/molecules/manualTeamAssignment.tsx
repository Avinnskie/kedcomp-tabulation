'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Team {
  id: number;
  name: string;
  institution: string | null;
  participants: Array<{
    id: number;
    name: string;
    email: string;
  }>;
}

interface TeamWithPosition {
  teamId: number;
  position: string;
}

interface SelectedTeam {
  teamId: number;
  position: string;
}

interface Room {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  roomId: number;
  roomName: string;
  judgeId: number | null;
  judgeName: string | null;
  teams: Array<{
    id: number;
    teamId: number;
    teamName: string;
    position: string;
    participants: Array<{
      id: number;
      name: string;
      email: string;
    }>;
  }>;
}

interface Round {
  id: number;
  name: string;
  number: number;
}

export default function ManualTeamAssignment() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states for creating new assignment
  const [showNewAssignmentDialog, setShowNewAssignmentDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<SelectedTeam[]>([]);

  // Room management states
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    // Load rounds on component mount
    fetchRounds();
  }, []);

  // useEffect(() => {
  //   if (selectedRound) {
  //     fetchAssignmentData();
  //   }
  // }, [selectedRound, fetchAssignmentData]);

  const fetchRounds = async () => {
    try {
      const res = await fetch('/api/getBracket');
      const data = await res.json();
      setRounds(data.rounds || []);
    } catch (error) {
      toast.error('Failed to load rounds');
    }
  };

  const fetchAssignmentData = useCallback(async () => {
    if (!selectedRound) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/manual-assignment?roundId=${selectedRound}`);
      const data = await res.json();

      if (res.ok) {
        setRooms(data.rooms);
        setAvailableTeams(data.availableTeams);
        setExistingAssignments(data.existingAssignments);
      } else {
        toast.error(data.error || 'Failed to load assignment data');
      }
    } catch (error) {
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  }, [selectedRound]);

  useEffect(() => {
    if (selectedRound) {
      fetchAssignmentData();
    }
  }, [selectedRound, fetchAssignmentData]);

  const handleCreateAssignment = async () => {
    if (!selectedRound || !selectedRoom || selectedTeams.length !== 4) {
      toast.error('Please select a round, room, and exactly 4 teams');
      return;
    }

    // Validate positions are unique and all selected
    const positions = selectedTeams.map(team => team.position).filter(p => p);
    if (positions.length !== 4 || new Set(positions).size !== 4) {
      toast.error('Please assign unique positions to all 4 teams');
      return;
    }

    try {
      const res = await fetch('/api/admin/manual-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: parseInt(selectedRound),
          roomId: parseInt(selectedRoom),
          teams: selectedTeams,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Teams assigned successfully');
        setShowNewAssignmentDialog(false);
        setSelectedRoom('');
        setSelectedTeams([]);
        fetchAssignmentData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to assign teams');
      }
    } catch (error) {
      toast.error('Failed to assign teams');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/manual-assignment?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Assignment removed successfully');
        fetchAssignmentData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to remove assignment');
      }
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Room created successfully');
        setShowRoomDialog(false);
        setNewRoomName('');
        fetchAssignmentData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to create room');
      }
    } catch (error) {
      toast.error('Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const positionColors = {
    OG: 'bg-blue-100 text-blue-800',
    OO: 'bg-green-100 text-green-800',
    CG: 'bg-yellow-100 text-yellow-800',
    CO: 'bg-red-100 text-red-800',
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manual Team Assignment</h1>
        <div className="flex gap-2">
          <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowRoomDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={creatingRoom}>
                    {creatingRoom ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={fetchAssignmentData}
            variant="outline"
            disabled={!selectedRound || loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Round Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Round</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a round..." />
            </SelectTrigger>
            <SelectContent>
              {rounds.map(round => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.name} (Round {round.number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRound && (
        <>
          {/* Available Teams & New Assignment Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Available Teams: {availableTeams.length}</h3>
              <p className="text-sm text-muted-foreground">Teams not yet assigned to this round</p>
            </div>

            <Dialog open={showNewAssignmentDialog} onOpenChange={setShowNewAssignmentDialog}>
              <DialogTrigger asChild>
                <Button disabled={availableTeams.length < 4}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Teams to Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign Teams to Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Room Selection */}
                  <div>
                    <Label>Select Room</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms
                          .filter(
                            room =>
                              !existingAssignments.some(assignment => assignment.roomId === room.id)
                          )
                          .map(room => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Selection with Position */}
                  <div>
                    <Label>Select Teams and Assign Positions (Choose exactly 4)</Label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                      {availableTeams.map(team => {
                        const selectedTeam = selectedTeams.find(st => st.teamId === team.id);
                        const isSelected = !!selectedTeam;
                        const usedPositions = selectedTeams.map(st => st.position).filter(p => p);
                        
                        return (
                          <div key={team.id} className="flex items-start space-x-3 p-2 border rounded">
                            <input
                              type="checkbox"
                              id={`team-${team.id}`}
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  if (selectedTeams.length < 4) {
                                    setSelectedTeams([...selectedTeams, { teamId: team.id, position: '' }]);
                                  }
                                } else {
                                  setSelectedTeams(selectedTeams.filter(st => st.teamId !== team.id));
                                }
                              }}
                              disabled={selectedTeams.length >= 4 && !isSelected}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <label htmlFor={`team-${team.id}`} className="text-sm cursor-pointer">
                                <strong>{team.name}</strong>
                                {team.institution && (
                                  <span className="text-muted-foreground"> - {team.institution}</span>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {team.participants.map(p => p.name).join(', ')}
                                </div>
                              </label>
                              
                              {isSelected && (
                                <div className="w-full">
                                  <Select
                                    value={selectedTeam?.position || ''}
                                    onValueChange={(position) => {
                                      setSelectedTeams(selectedTeams.map(st => 
                                        st.teamId === team.id ? { ...st, position } : st
                                      ));
                                    }}
                                  >
                                    <SelectTrigger className="w-full h-8">
                                      <SelectValue placeholder="Select position..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['OG', 'OO', 'CG', 'CO'].map(position => (
                                        <SelectItem 
                                          key={position} 
                                          value={position}
                                          disabled={usedPositions.includes(position) && selectedTeam?.position !== position}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Badge className={`${positionColors[position as keyof typeof positionColors]} text-xs`}>
                                              {position}
                                            </Badge>
                                            <span>
                                              {position === 'OG' ? 'Opening Government' :
                                               position === 'OO' ? 'Opening Opposition' :
                                               position === 'CG' ? 'Closing Government' : 'Closing Opposition'}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p>Selected: {selectedTeams.length}/4 teams</p>
                      {selectedTeams.length > 0 && (
                        <p>Positions assigned: {selectedTeams.filter(st => st.position).length}/4</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewAssignmentDialog(false);
                        setSelectedRoom('');
                        setSelectedTeams([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateAssignment}
                      disabled={
                        !selectedRoom || 
                        selectedTeams.length !== 4 || 
                        selectedTeams.filter(st => st.position).length !== 4
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Assign Teams
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Existing Assignments */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Current Assignments ({existingAssignments.length} rooms)
            </h3>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : existingAssignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No assignments yet for this round.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click &quot;Assign Teams to Room&quot; to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {existingAssignments.map(assignment => (
                  <Card key={assignment.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">{assignment.roomName}</CardTitle>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {assignment.judgeName && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Judge: {assignment.judgeName}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignment.teams.map(team => (
                          <div key={team.id} className="flex items-start space-x-2">
                            <Badge
                              className={`${positionColors[team.position as keyof typeof positionColors]} shrink-0`}
                            >
                              {team.position}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{team.teamName}</p>
                              <p className="text-xs text-muted-foreground">
                                {team.participants.map(p => p.name).join(', ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
