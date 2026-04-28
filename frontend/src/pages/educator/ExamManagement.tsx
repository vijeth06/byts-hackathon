/**
 * 🎓 Academic Intelligence Platform - Exam Management Page
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Avatar,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useExamStore } from '@/store';
import { Exam } from '@/types';

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    exams, 
    isLoadingExams, 
    examsError, 
    fetchExams, 
    createExam,  
    deleteExam, 
    publishExam,
    clearError 
  } = useExamStore();

  // Suppress MUI popover warnings
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('anchorEl') || args[0]?.includes?.('Popover')) {
        return;
      }
      originalError(...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    instructions: '',
    examType: 'quiz',
    courseId: '',
    totalMarks: 100,
    passingMarks: 40,
    durationMinutes: 60,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResult: true,
    showAnswers: false,
    negativeMarking: false,
    maxAttempts: 1,
    startTime: null as Date | null,
    endTime: null as Date | null,
  });

  const [hasFetched, setHasFetched] = useState(false);

  // Fetch exams on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !token) return;
    setHasFetched(true);
    fetchExams();
  }, [hasFetched]);

  const handleDelete = async () => {
    if (selectedExam) {
      if (['active', 'completed'].includes(selectedExam.status)) {
        setDeleteDialogOpen(false);
        return;
      }
      const success = await deleteExam(selectedExam.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedExam(null);
      }
    }
  };

  const handlePublish = async (exam: Exam) => {
    await publishExam(exam.id);
  };

  const handleCreateExam = async () => {
    if (!examForm.title || !examForm.examType) {
      alert('Please fill in title and exam type');
      return;
    }
    const success = await createExam({
      title: examForm.title,
      description: examForm.description,
      instructions: examForm.instructions,
      examType: examForm.examType,
      courseId: examForm.courseId || undefined,
      totalMarks: examForm.totalMarks,
      passingMarks: examForm.passingMarks,
      durationMinutes: examForm.durationMinutes,
      shuffleQuestions: examForm.shuffleQuestions,
      shuffleOptions: examForm.shuffleOptions,
      showResult: examForm.showResult,
      showAnswers: examForm.showAnswers,
      negativeMarking: examForm.negativeMarking,
      maxAttempts: examForm.maxAttempts,
      startTime: examForm.startTime?.toISOString(),
      endTime: examForm.endTime?.toISOString(),
    });
    
    if (success) {
      setCreateDialogOpen(false);
      resetForm();
      setActiveStep(0);
      // Refresh exams list after creation
      await fetchExams();
    } else {
      const latestError = useExamStore.getState().examsError;
      alert(`Failed to create exam: ${latestError || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setExamForm({
      title: '',
      description: '',
      instructions: '',
      examType: 'quiz',
      courseId: '',
      totalMarks: 100,
      passingMarks: 40,
      durationMinutes: 60,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResult: true,
      showAnswers: false,
      negativeMarking: false,
      maxAttempts: 1,
      startTime: null,
      endTime: null,
    });
    setActiveStep(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'published': return 'success';
      case 'scheduled': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'published': return <StartIcon />;
      case 'scheduled': return <ScheduleIcon />;
      case 'completed': return <ViewIcon />;
      default: return <EditIcon />;
    }
  };

  const dedupeExams = (items: Exam[]) => {
    const uniqueMap = new Map<string | number, Exam>();
    items.forEach((exam) => {
      uniqueMap.set(exam.id, exam);
    });
    return Array.from(uniqueMap.values());
  };

  const filterExams = (status?: string) => {
    if (!exams) return [];
    const base = dedupeExams(exams);
    if (!status || status === 'all') return base;
    return base.filter((e) => getEffectiveStatus(e) === status);
  };

  const getEffectiveStatus = (exam: Exam) => {
    // Draft exams should always show as draft regardless of time
    if (exam.status === 'draft') {
      return 'draft';
    }

    const now = new Date();
    const startAt = exam.startTime
      ? new Date(exam.startTime)
      : (exam.createdAt ? new Date(exam.createdAt) : null);
    const endAt = (() => {
      if (startAt && exam.durationMinutes) {
        const computed = new Date(startAt);
        computed.setMinutes(computed.getMinutes() + exam.durationMinutes);
        if (exam.endTime) {
          const explicitEnd = new Date(exam.endTime);
          return computed <= explicitEnd ? computed : explicitEnd;
        }
        return computed;
      }
      if (exam.endTime) return new Date(exam.endTime);
      return null;
    })();

    if (endAt && endAt <= now) {
      return 'completed';
    }

    if (exam.status === 'published' && startAt && startAt > now) {
      return 'scheduled';
    }

    return exam.status;
  };

  const getTabExams = () => {
    switch (tabValue) {
      case 0: return filterExams();
      case 1: return dedupeExams(filterExams('active').concat(filterExams('published')));
      case 2: return filterExams('scheduled');
      case 3: return filterExams('draft');
      case 4: return filterExams('completed');
      default: return filterExams();
    }
  };

  const steps = ['Basic Info', 'Settings', 'Schedule'];

  const ExamCard: React.FC<{ exam: Exam }> = ({ exam }) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setMenuAnchorEl(null);
    };

    const effectiveStatus = getEffectiveStatus(exam);

    return (
      <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }, position: 'relative', overflow: 'visible' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Avatar sx={{ bgcolor: effectiveStatus === 'active' || effectiveStatus === 'published' ? 'success.light' : effectiveStatus === 'scheduled' ? 'warning.light' : 'primary.light' }}>
              <AssignmentIcon />
            </Avatar>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={effectiveStatus} size="small" color={getStatusColor(effectiveStatus) as any} icon={getStatusIcon(effectiveStatus)} />
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom noWrap>{exam.title}</Typography>
        <Typography variant="body2" color="text.secondary" mb={2} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {exam.description || 'No description'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Duration</Typography>
            <Typography variant="body2" fontWeight={500}>{exam.durationMinutes} min</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Total Marks</Typography>
            <Typography variant="body2" fontWeight={500}>{exam.totalMarks}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Questions</Typography>
            <Typography variant="body2" fontWeight={500}>{exam.questions?.length || 0}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Submissions</Typography>
            <Typography variant="body2" fontWeight={500}>{(exam as any).submissions || 0}</Typography>
          </Grid>
        </Grid>

          {(exam as any).avgScore !== undefined && (
            <Box mt={2} p={1.5} bgcolor="grey.50" borderRadius={2}>
              <Typography variant="caption" color="text.secondary">Average Score</Typography>
              <Typography variant="h6" fontWeight={600} color="primary">{Math.round((exam as any).avgScore)}%</Typography>
            </Box>
          )}
        </CardContent>

        <Menu
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          disableEnforceFocus={true}
          slotProps={{
            paper: {
              sx: {
                boxShadow: 3,
                mt: 1,
              },
            },
          }}
        >
          <MenuItem onClick={() => { navigate(`/educator/exams/${exam.id}`); handleMenuClose(); }}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={() => { navigate(`/educator/exams/${exam.id}/edit`); handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1 }} /> Edit & Assign
          </MenuItem>
          {effectiveStatus === 'draft' && (
            <MenuItem onClick={() => { handlePublish(exam); handleMenuClose(); }}>
              <StartIcon sx={{ mr: 1 }} /> Publish
            </MenuItem>
          )}
          <MenuItem
            onClick={() => { setSelectedExam(exam); setDeleteDialogOpen(true); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
            disabled={['active', 'completed'].includes(effectiveStatus)}
          >
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Card>
    );
  };

  if (isLoadingExams && (!exams || exams.length === 0)) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Error Alert */}
        {examsError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => { clearError(); fetchExams(); }}>
                Retry
              </Button>
            }
          >
            {examsError}
          </Alert>
        )}

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>Exam Management</Typography>
            <Typography variant="body1" color="text.secondary">Create, schedule, and manage your exams</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            Create Exam
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={`All (${filterExams().length})`} />
            <Tab label={`Active (${filterExams('active').length + filterExams('published').length})`} />
            <Tab label={`Scheduled (${filterExams('scheduled').length})`} />
            <Tab label={`Draft (${filterExams('draft').length})`} />
            <Tab label={`Completed (${filterExams('completed').length})`} />
          </Tabs>
        </Paper>

        {/* Exam Grid */}
        <Grid container spacing={3}>
          {getTabExams().length > 0 ? (
            getTabExams().map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam.id}>
                <ExamCard exam={exam} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No exams found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first exam to get started
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                  Create Exam
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ my: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Exam Title"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Exam Type</InputLabel>
                    <Select
                      value={examForm.examType}
                      label="Exam Type"
                      onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                    >
                      <MenuItem value="quiz">Quiz</MenuItem>
                      <MenuItem value="unit_test">Unit Test</MenuItem>
                      <MenuItem value="internal">Internal</MenuItem>
                      <MenuItem value="midterm">Midterm</MenuItem>
                      <MenuItem value="final">Final</MenuItem>
                      <MenuItem value="practice">Practice</MenuItem>
                      <MenuItem value="assignment">Assignment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Marks"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Passing Marks"
                    value={examForm.passingMarks}
                    onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration (minutes)"
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.shuffleQuestions}
                        onChange={(e) => setExamForm({ ...examForm, shuffleQuestions: e.target.checked })}
                      />
                    }
                    label="Shuffle Questions"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.showResult}
                        onChange={(e) => setExamForm({ ...examForm, showResult: e.target.checked })}
                      />
                    }
                    label="Show Results Immediately"
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={examForm.startTime}
                    onChange={(date) => setExamForm({ ...examForm, startTime: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={examForm.endTime}
                    onChange={(date) => setExamForm({ ...examForm, endTime: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            {activeStep > 0 && (
              <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="contained" onClick={handleCreateExam} disabled={!examForm.title}>
                Create Exam
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Exam</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedExam?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ExamManagement;
