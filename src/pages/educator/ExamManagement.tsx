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
  
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    courseId: 1,
    totalMarks: 100,
    passingMarks: 40,
    durationMinutes: 60,
    shuffleQuestions: true,
    showResults: true,
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  // Fetch exams on mount
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: Exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (selectedExam) {
      const success = await deleteExam(Number(selectedExam.id));
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedExam(null);
      }
    }
  };

  const handlePublish = async () => {
    if (selectedExam) {
      await publishExam(Number(selectedExam.id));
      handleMenuClose();
    }
  };

  const handleCreateExam = async () => {
    const success = await createExam({
      title: examForm.title,
      description: examForm.description,
      courseId: examForm.courseId,
      totalMarks: examForm.totalMarks,
      passingMarks: examForm.passingMarks,
      durationMinutes: examForm.durationMinutes,
      shuffleQuestions: examForm.shuffleQuestions,
      showResults: examForm.showResults,
      scheduledAt: examForm.startDate?.toISOString(),
    });
    
    if (success) {
      setCreateDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setExamForm({
      title: '',
      description: '',
      courseId: 1,
      totalMarks: 100,
      passingMarks: 40,
      durationMinutes: 60,
      shuffleQuestions: true,
      showResults: true,
      startDate: null,
      endDate: null,
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

  const filterExams = (status?: string) => {
    if (!exams) return [];
    if (!status || status === 'all') return exams;
    return exams.filter((e) => e.status === status);
  };

  const getTabExams = () => {
    switch (tabValue) {
      case 0: return filterExams();
      case 1: return filterExams('active').concat(filterExams('published'));
      case 2: return filterExams('scheduled');
      case 3: return filterExams('draft');
      case 4: return filterExams('completed');
      default: return filterExams();
    }
  };

  const steps = ['Basic Info', 'Settings', 'Schedule'];

  const ExamCard: React.FC<{ exam: Exam }> = ({ exam }) => (
    <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Avatar sx={{ bgcolor: exam.status === 'active' || exam.status === 'published' ? 'success.light' : exam.status === 'scheduled' ? 'warning.light' : 'primary.light' }}>
            <AssignmentIcon />
          </Avatar>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={exam.status} size="small" color={getStatusColor(exam.status) as any} icon={getStatusIcon(exam.status)} />
            <IconButton size="small" onClick={(e) => handleMenuOpen(e, exam)}>
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
    </Card>
  );

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

        {/* Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { navigate(`/educator/exams/${selectedExam?.id}`); handleMenuClose(); }}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={() => { navigate(`/educator/exams/${selectedExam?.id}/edit`); handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
          {selectedExam?.status === 'draft' && (
            <MenuItem onClick={handlePublish}>
              <StartIcon sx={{ mr: 1 }} /> Publish
            </MenuItem>
          )}
          <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

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
                        checked={examForm.showResults}
                        onChange={(e) => setExamForm({ ...examForm, showResults: e.target.checked })}
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
                    value={examForm.startDate}
                    onChange={(date) => setExamForm({ ...examForm, startDate: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={examForm.endDate}
                    onChange={(date) => setExamForm({ ...examForm, endDate: date })}
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
