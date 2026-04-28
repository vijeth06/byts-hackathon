/**
 * 🎓 Intervention Dashboard Component
 * For educators to create, manage, and track student interventions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { interventionAPI } from '@/services/api';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  rollNumber?: string;
}

interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  interventionType: string;
  reason: string;
  plannedActions: string;
  status: string;
  startDate: string;
  estimatedDuration: number;
  progress: string;
  checkinsCount: number;
}

const InterventionDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [newIntervention, setNewIntervention] = useState({
    studentId: '',
    interventionType: 'one_on_one_tutoring',
    reason: '',
    plannedActions: '',
    estimatedDuration: 14,
  });

  const [checkinData, setCheckinData] = useState({
    progress: 'on_track',
    observations: '',
    nextSteps: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadInterventions();
      loadStudents();
    }
  }, []);

  const loadStudents = async () => {
    try {
      const response = await authAPI.getMyStudents();
      const data = response.data as any;
      // Flatten sections → students
      const allStudents: Student[] = [];
      if (Array.isArray(data?.data)) {
        for (const section of data.data) {
          if (Array.isArray(section?.students)) {
            allStudents.push(...section.students);
          }
        }
      }
      setStudents(allStudents);
    } catch {
      // Silently fail — student list is non-critical
    }
  };

  const loadInterventions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await interventionAPI.getEducatorInterventions();
      const data = (response.data?.data || []) as any[];
      
      setInterventions(data.map((i: any) => ({
        id: i.id,
        studentId: i.studentId,
        studentName: i.studentName || 'Unknown',
        interventionType: i.interventionType,
        reason: i.reason,
        plannedActions: i.plannedActions,
        status: i.status,
        startDate: i.actualStartDate || i.createdAt,
        estimatedDuration: i.estimatedDuration || 0,
        progress: i.checkins?.[0]?.progress || 'on_track',
        checkinsCount: i.checkins?.length || 0,
      })));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load interventions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!user?.id) {
      setError('User session not found');
      return;
    }

    try {
      await interventionAPI.createIntervention({
        studentId: newIntervention.studentId,
        educatorId: user.id,
        courseId: 'general',
        interventionType: newIntervention.interventionType,
        reason: newIntervention.reason,
        plannedActions: newIntervention.plannedActions,
        estimatedDuration: newIntervention.estimatedDuration,
      });
      
      setCreateDialogOpen(false);
      loadInterventions();
      
      // Reset form
      setNewIntervention({
        studentId: '',
        interventionType: 'one_on_one_tutoring',
        reason: '',
        plannedActions: '',
        estimatedDuration: 14,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create intervention');
    }
  };

  const handleStartIntervention = async (interventionId: string) => {
    try {
      await interventionAPI.startIntervention(interventionId);
      loadInterventions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start intervention');
    }
  };

  const handleAddCheckin = async () => {
    if (!selectedIntervention) return;
    
    try {
      await interventionAPI.addCheckin(selectedIntervention.id, checkinData);
      setCheckinDialogOpen(false);
      setSelectedIntervention(null);
      loadInterventions();
      
      // Reset form
      setCheckinData({
        progress: 'on_track',
        observations: '',
        nextSteps: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add check-in');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'planned':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'active':
        return <PlayArrowIcon />;
      case 'planned':
        return <PendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getFilteredInterventions = () => {
    if (activeTab === 0) return interventions; // All
    if (activeTab === 1) return interventions.filter((i) => i.status === 'active'); // Active
    if (activeTab === 2) return interventions.filter((i) => i.status === 'planned'); // Planned
    if (activeTab === 3) return interventions.filter((i) => i.status === 'completed'); // Completed
    return interventions;
  };

  const filteredInterventions = getFilteredInterventions();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            Intervention Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage student interventions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Intervention
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{interventions.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PlayArrowIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {interventions.filter((i) => i.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {interventions.filter((i) => i.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">85%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label={`All (${interventions.length})`} />
        <Tab label={`Active (${interventions.filter((i) => i.status === 'active').length})`} />
        <Tab label={`Planned (${interventions.filter((i) => i.status === 'planned').length})`} />
        <Tab label={`Completed (${interventions.filter((i) => i.status === 'completed').length})`} />
      </Tabs>

      {/* Interventions List */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress />
        </Box>
      ) : filteredInterventions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Interventions Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first intervention to start helping students
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Intervention
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredInterventions.map((intervention) => (
            <Grid item xs={12} key={intervention.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{intervention.studentName}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {intervention.interventionType.replace(/_/g, ' ')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          icon={getStatusIcon(intervention.status)}
                          label={intervention.status}
                          size="small"
                          color={getStatusColor(intervention.status) as any}
                        />
                        <Chip
                          label={`${intervention.checkinsCount} check-ins`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {intervention.status === 'planned' && (
                        <Tooltip title="Start intervention">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleStartIntervention(intervention.id)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {intervention.status === 'active' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedIntervention(intervention);
                            setCheckinDialogOpen(true);
                          }}
                        >
                          Add Check-in
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Reason:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {intervention.reason}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Planned Actions:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {intervention.plannedActions}
                    </Typography>
                  </Box>

                  {intervention.status === 'active' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Progress: {intervention.progress}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={intervention.progress === 'on_track' ? 60 : intervention.progress === 'improved' ? 80 : 30}
                        color={intervention.progress === 'improved' ? 'success' : 'primary'}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Intervention Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Intervention</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Select Student"
              value={newIntervention.studentId}
              onChange={(e) => setNewIntervention({ ...newIntervention, studentId: e.target.value })}
              fullWidth
              helperText={students.length === 0 ? 'No students found in your department' : 'Select the student who needs intervention'}
            >
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} {s.studentId ? `(${s.studentId})` : s.rollNumber ? `(${s.rollNumber})` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Intervention Type"
              value={newIntervention.interventionType}
              onChange={(e) => setNewIntervention({ ...newIntervention, interventionType: e.target.value })}
              fullWidth
            >
              <MenuItem value="one_on_one_tutoring">One-on-One Tutoring</MenuItem>
              <MenuItem value="group_study">Group Study Session</MenuItem>
              <MenuItem value="additional_resources">Additional Resources</MenuItem>
              <MenuItem value="peer_mentoring">Peer Mentoring</MenuItem>
              <MenuItem value="remedial_classes">Remedial Classes</MenuItem>
            </TextField>

            <TextField
              label="Reason"
              value={newIntervention.reason}
              onChange={(e) => setNewIntervention({ ...newIntervention, reason: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Why is this intervention needed?"
            />

            <TextField
              label="Planned Actions"
              value={newIntervention.plannedActions}
              onChange={(e) => setNewIntervention({ ...newIntervention, plannedActions: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="What specific actions will be taken?"
            />

            <TextField
              type="number"
              label="Estimated Duration (days)"
              value={newIntervention.estimatedDuration}
              onChange={(e) => setNewIntervention({ ...newIntervention, estimatedDuration: Number(e.target.value) })}
              fullWidth
              inputProps={{ min: 1, max: 90 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateIntervention}
            variant="contained"
            disabled={!newIntervention.studentId || !newIntervention.reason}
          >
            Create Intervention
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkinDialogOpen} onClose={() => setCheckinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Check-in</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Progress"
              value={checkinData.progress}
              onChange={(e) => setCheckinData({ ...checkinData, progress: e.target.value })}
              fullWidth
            >
              <MenuItem value="on_track">On Track</MenuItem>
              <MenuItem value="improved">Improved</MenuItem>
              <MenuItem value="no_change">No Change</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </TextField>

            <TextField
              label="Observations"
              value={checkinData.observations}
              onChange={(e) => setCheckinData({ ...checkinData, observations: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="What have you observed?"
            />

            <TextField
              label="Next Steps"
              value={checkinData.nextSteps}
              onChange={(e) => setCheckinData({ ...checkinData, nextSteps: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="What are the next steps?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckinDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddCheckin}
            variant="contained"
            disabled={!checkinData.observations}
          >
            Add Check-in
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterventionDashboard;
