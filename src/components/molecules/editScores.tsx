'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Edit3,
  Search,
  RefreshCw,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Score {
  id: number;
  roundId: number;
  roundName: string;
  roundNumber: number;
  teamId: number;
  teamName: string;
  participantId: number | null;
  participantName: string | null;
  judgeId: number;
  judgeName: string;
  scoreType: 'TEAM' | 'INDIVIDUAL';
  value: number;
  createdAt: string;
  updatedAt: string;
}

interface Round {
  id: number;
  name: string;
  number: number;
}

interface ScoreData {
  scores: Score[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  rounds: Round[];
}

export default function EditScores() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Filter & Search states
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [newValue, setNewValue] = useState('');
  const [editReason, setEditReason] = useState('');

  // Delete Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingScore, setDeletingScore] = useState<Score | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedRound, searchQuery, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (selectedRound && selectedRound !== 'all') params.append('roundId', selectedRound);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/scores?${params}`);
      const result: ScoreData = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error('Failed to load scores data');
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditScore = async () => {
    if (!editingScore || !newValue) {
      toast.error('Please enter a new score value');
      return;
    }

    const numValue = Number(newValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    // Validate score ranges
    if (editingScore.scoreType === 'TEAM' && (numValue < 0 || numValue > 100)) {
      toast.error('Team score must be between 0 and 100');
      return;
    }

    if (editingScore.scoreType === 'INDIVIDUAL' && (numValue < 0 || numValue > 50)) {
      toast.error('Individual score must be between 0 and 50');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreId: editingScore.id,
          newValue: numValue,
          reason: editReason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Score updated successfully');
        setEditDialogOpen(false);
        setEditingScore(null);
        setNewValue('');
        setEditReason('');
        fetchData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('An error occurred while updating score');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteScore = async () => {
    if (!deletingScore) return;

    setDeleting(true);
    try {
      const params = new URLSearchParams({
        scoreId: deletingScore.id.toString(),
      });
      
      if (deleteReason.trim()) {
        params.append('reason', deleteReason.trim());
      }

      const response = await fetch(`/api/admin/scores?${params}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Score deleted successfully');
        setDeleteDialogOpen(false);
        setDeletingScore(null);
        setDeleteReason('');
        fetchData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to delete score');
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      toast.error('An error occurred while deleting score');
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (score: Score) => {
    setEditingScore(score);
    setNewValue(score.value.toString());
    setEditReason('');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (score: Score) => {
    setDeletingScore(score);
    setDeleteReason('');
    setDeleteDialogOpen(true);
  };

  const getScoreTypeIcon = (scoreType: string) => {
    return scoreType === 'TEAM' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getScoreTypeBadge = (scoreType: string) => {
    return scoreType === 'TEAM' 
      ? <Badge variant="default" className="bg-blue-100 text-blue-800">Team</Badge>
      : <Badge variant="secondary" className="bg-green-100 text-green-800">Individual</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Edit Scores</h2>
        <p className="text-gray-600">
          View and edit submitted scores. Changes will be logged for audit purposes.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Round Filter */}
            <div className="flex-1">
              <Label htmlFor="round-filter">Filter by Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger id="round-filter">
                  <SelectValue placeholder="All rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rounds</SelectItem>
                  {data?.rounds.map(round => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.name} (Round {round.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by team, participant, or judge name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <Button onClick={fetchData} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      {data && (
        <div className="text-sm text-gray-600">
          Showing {data.scores.length} of {data.pagination.totalCount} scores
          {selectedRound && selectedRound !== 'all' && ` in ${data.rounds.find(r => r.id.toString() === selectedRound)?.name}`}
        </div>
      )}

      {/* Scores Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Judge</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.scores.map((score) => (
                <TableRow key={score.id}>
                  <TableCell>
                    <div className="font-medium">{score.roundName}</div>
                    <div className="text-sm text-gray-500">Round {score.roundNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getScoreTypeIcon(score.scoreType)}
                      {getScoreTypeBadge(score.scoreType)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{score.teamName}</TableCell>
                  <TableCell>{score.participantName || '-'}</TableCell>
                  <TableCell>{score.judgeName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-lg font-bold">
                      {score.value}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(score.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(score.updatedAt).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(score)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(score)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {data?.scores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No scores found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= data.pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Score</DialogTitle>
          </DialogHeader>
          
          {editingScore && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are editing a submitted score. This action will be logged.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Score Details</Label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Round:</strong> {editingScore.roundName}</div>
                  <div><strong>Type:</strong> {editingScore.scoreType}</div>
                  <div><strong>Team:</strong> {editingScore.teamName}</div>
                  {editingScore.participantName && (
                    <div><strong>Participant:</strong> {editingScore.participantName}</div>
                  )}
                  <div><strong>Judge:</strong> {editingScore.judgeName}</div>
                  <div><strong>Current Score:</strong> {editingScore.value}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-value">
                  New Score Value ({editingScore.scoreType === 'TEAM' ? '0-100' : '0-50'})
                </Label>
                <Input
                  id="new-value"
                  type="number"
                  min="0"
                  max={editingScore.scoreType === 'TEAM' ? 100 : 50}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter new score value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reason">Reason for Edit (Optional)</Label>
                <Textarea
                  id="edit-reason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Enter reason for this edit..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditScore}
              disabled={updating || !newValue}
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Score
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Score</DialogTitle>
          </DialogHeader>
          
          {deletingScore && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This action cannot be undone. The score will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Score to Delete</Label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Round:</strong> {deletingScore.roundName}</div>
                  <div><strong>Type:</strong> {deletingScore.scoreType}</div>
                  <div><strong>Team:</strong> {deletingScore.teamName}</div>
                  {deletingScore.participantName && (
                    <div><strong>Participant:</strong> {deletingScore.participantName}</div>
                  )}
                  <div><strong>Score:</strong> {deletingScore.value}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason for Deletion (Required)</Label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason for deleting this score..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteScore}
              disabled={deleting || !deleteReason.trim()}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Score
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
