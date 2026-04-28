/**
 * 🎯 Goal Tracker Component
 * Displays and manages student learning goals
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { examAPI, goalAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface GoalDraft {
  goalType: string;
  targetMetric: string;
  targetValue: number;
  targetDate: string;
  priority: string;
  description: string;
}

interface Goal {
  id: number;
  goalType: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  targetDate: string;
  priority: string;
  status: string;
  description: string;
  progress: number;
  daysRemaining: number;
}

interface GoalTrackerProps {
  courseId?: number | string;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ courseId }) => {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const getDefaultTargetDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const [newGoal, setNewGoal] = useState<GoalDraft>({
    goalType: 'score_improvement',
    targetMetric: 'average_score',
    targetValue: 85,
    targetDate: getDefaultTargetDate(),
    priority: 'medium',
    description: '',
  });

  const resolveCourseId = (): number | string | undefined => {
    if (courseId !== undefined && courseId !== null && String(courseId).trim() !== '') {
      return courseId;
    }

    const userCourseId = (user as any)?.currentCourseId || (user as any)?.courseId;
    if (userCourseId !== undefined && userCourseId !== null && String(userCourseId).trim() !== '') {
      return userCourseId;
    }

    const goalCourseId = (goals[0] as any)?.courseId;
    if (goalCourseId !== undefined && goalCourseId !== null && String(goalCourseId).trim() !== '') {
      return goalCourseId;
    }

    return undefined;
  };

  const resolveCourseIdFromApi = async (): Promise<number | string | undefined> => {
    try {
      const response = await examAPI.getAvailableExams();
      const payload = response.data?.data as any;
      const exams = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.exams)
          ? payload.exams
          : [];

      const firstExamWithCourse = exams.find((exam: any) => exam?.courseId);
      return firstExamWithCourse?.courseId;
    } catch {
      return undefined;
    }
  };

  const openCreateDialog = (prefill?: Partial<GoalDraft>) => {
    setError(null);
    setNewGoal({
      goalType: prefill?.goalType || 'score_improvement',
      targetMetric: prefill?.targetMetric || 'average_score',
      targetValue: prefill?.targetValue ?? 85,
      targetDate: prefill?.targetDate || getDefaultTargetDate(),
      priority: prefill?.priority || 'medium',
      description: prefill?.description || '',
    });
    setCreateDialogOpen(true);
  };

  useEffect(() => {
    if (user?.id) {
      loadGoals();
    }
  }, []);

  useEffect(() => {
    const handleCreateGoalEvent = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<GoalDraft>>;
      openCreateDialog(customEvent.detail || {});
      const target = document.getElementById('goal-tracker-section');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const pendingGoal = sessionStorage.getItem('aip:pending-goal-prefill');
    if (pendingGoal) {
      try {
        openCreateDialog(JSON.parse(pendingGoal) as Partial<GoalDraft>);
      } catch {
        // ignore malformed prefill payloads
      } finally {
        sessionStorage.removeItem('aip:pending-goal-prefill');
      }
    }

    window.addEventListener('aip:create-goal', handleCreateGoalEvent as EventListener);
    return () => {
      window.removeEventListener('aip:create-goal', handleCreateGoalEvent as EventListener);
    };
  }, [courseId, goals]);

  const loadGoals = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await goalAPI.getStudentGoals(user.id, { status: 'active' });
      const responseData = response.data.data as any[];
      
      // Transform and enhance data
      const enhancedGoals = (Array.isArray(responseData) ? responseData : []).map((goal: any) => ({
        ...goal,
        progress: Math.min(100, ((goal.currentValue / goal.targetValue) * 100)),
        daysRemaining: Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      }));
      
      setGoals(enhancedGoals);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!user?.id) {
      setError('User session not found');
      return;
    }

    let resolvedCourseId = resolveCourseId();
    if (!resolvedCourseId) {
      resolvedCourseId = await resolveCourseIdFromApi();
    }

    if (!resolvedCourseId) {
      setError('No course context found for this account yet. Please attempt an assigned exam first, then create a goal.');
      return;
    }

    try {
      await goalAPI.createGoal({
        studentId: user.id,
        courseId: resolvedCourseId,
        ...newGoal,
      });
      
      setCreateDialogOpen(false);
      loadGoals();
      
      // Reset form
      setNewGoal({
        goalType: 'score_improvement',
        targetMetric: 'average_score',
        targetValue: 85,
        targetDate: getDefaultTargetDate(),
        priority: 'medium',
        description: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create goal');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading your goals...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} id="goal-tracker-section">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            My Learning Goals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your progress and achieve your academic targets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCreateDialog()}
        >
          Create Goal
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Goals Grid */}
      <Grid container spacing={3}>
        {goals.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Goals Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first learning goal to start tracking your progress
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openCreateDialog()}
                >
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          goals.map((goal) => (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  {/* Goal Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {goal.description || goal.goalType.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={goal.priority}
                          size="small"
                          color={getPriorityColor(goal.priority) as any}
                        />
                        <Chip
                          label={goal.goalType.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Tooltip title="Edit goal">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Progress Section */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={getProgressColor(goal.progress)}>
                        {goal.progress.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress}
                      color={getProgressColor(goal.progress) as any}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  {/* Current vs Target */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Current
                      </Typography>
                      <Typography variant="h6">
                        {goal.currentValue}{goal.targetMetric.includes('score') ? '%' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Target
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {goal.targetValue}{goal.targetMetric.includes('score') ? '%' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Time Remaining */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: goal.daysRemaining < 7 ? 'error.lighter' : 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <TimerIcon fontSize="small" color={goal.daysRemaining < 7 ? 'error' : 'action'} />
                    <Typography variant="body2">
                      {goal.daysRemaining > 0 ? (
                        <>
                          <strong>{goal.daysRemaining}</strong> days remaining
                        </>
                      ) : (
                        <strong style={{ color: 'red' }}>Overdue</strong>
                      )}
                    </Typography>
                  </Box>

                  {/* Achievement Badge */}
                  {goal.progress >= 100 && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                      <CheckCircleIcon />
                      <Typography variant="body2" fontWeight="bold">
                        Goal Achieved! 🎉
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Goal Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Goal Type"
              value={newGoal.goalType}
              onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
              fullWidth
            >
              <MenuItem value="score_improvement">Score Improvement</MenuItem>
              <MenuItem value="concept_mastery">Concept Mastery</MenuItem>
              <MenuItem value="consistency">Consistency</MenuItem>
              <MenuItem value="time_management">Time Management</MenuItem>
            </TextField>

            <TextField
              select
              label="Target Metric"
              value={newGoal.targetMetric}
              onChange={(e) => setNewGoal({ ...newGoal, targetMetric: e.target.value })}
              fullWidth
            >
              <MenuItem value="average_score">Average Score</MenuItem>
              <MenuItem value="exam_score">Single Exam Score</MenuItem>
              <MenuItem value="concept_accuracy">Concept Accuracy</MenuItem>
              <MenuItem value="completion_rate">Completion Rate</MenuItem>
            </TextField>

            <TextField
              type="number"
              label="Target Value"
              value={newGoal.targetValue}
              onChange={(e) => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
              helperText="Enter percentage (0-100)"
            />

            <TextField
              type="date"
              label="Target Date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Priority"
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>

            <TextField
              label="Description"
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your goal..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGoal}
            variant="contained"
            disabled={!newGoal.targetDate}
          >
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalTracker;
