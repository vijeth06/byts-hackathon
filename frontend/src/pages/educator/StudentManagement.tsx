/**
 * 🎓 Educator Student Management & Task Assignment Page
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Checkbox,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import { userAPI, taskAPI } from '@/services/api';

interface Student {
  id: string;
  _id?: string; // For backward compatibility
  firstName: string;
  lastName: string;
  email: string;
  studentClass?: string;
  rollNumber: string;
  phoneNumber?: string;
  currentSemester?: number;
  studentId?: string;
  section?: {
    id: string;
    name: string;
    year: number;
  };
  sectionId?: {
    _id: string;
    name: string;
    year?: number;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  institutionId?: {
    _id: string;
    name: string;
  };
}

// Helper function to extract class letter from section
const getClassLetter = (student: Student): string => {
  // First check if section has name from backend response
  if (student.section?.name) {
    return student.section.name;
  }
  // Fallback to sectionId from older response format
  if (student.sectionId?.name) {
    return student.sectionId.name;
  }
  // Otherwise extract from studentClass
  if (student.studentClass) {
    const match = student.studentClass.match(/[A-Z]$/i);
    if (match) return match[0].toUpperCase();
  }
  return '-';
};

const EducatorStudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    courseId: '',
    taskType: 'assignment',
    dueDate: '',
    instructions: '',
    totalMarks: 0,
  });

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await userAPI.getEducatorStudents();
        // Handle grouped response from /users/my-students endpoint
        const sectionGroups = response.data.data as any[];
        
        // Flatten the grouped response into a single student array
        const studentData: Student[] = [];
        if (Array.isArray(sectionGroups)) {
          sectionGroups.forEach((group) => {
            if (group.students && Array.isArray(group.students)) {
              studentData.push(...group.students);
            }
          });
        }
        
        setStudents(studentData);
        setFilteredStudents(studentData);
      } catch (error: any) {
        console.error('Failed to fetch students:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load students. Make sure they have completed their profiles.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          (s.studentId || s.rollNumber || '').toLowerCase().includes(query)
      );
    }

    // Filter by class if tab is selected
    if (tabValue > 0) {
      const classFilter = ['all', 'A', 'B', 'C'][tabValue];
      if (classFilter !== 'all') {
        filtered = filtered.filter((s) => getClassLetter(s) === classFilter);
      }
    }

    setFilteredStudents(filtered);
  }, [searchQuery, tabValue, students]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAssignTask = () => {
    if (selectedStudent) {
      const studentId = selectedStudent._id || selectedStudent.id;
      setSelectedStudents(new Set([studentId]));
      setTaskDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id || s.id).filter((id) => id !== undefined)));
    }
  };

  const handleBulkAssignTask = () => {
    if (selectedStudents.size === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one student',
        severity: 'error',
      });
      return;
    }
    setTaskDialogOpen(true);
  };

  const handleCreateAndAssignTask = async () => {
    if (!taskForm.title || !taskForm.dueDate || selectedStudents.size === 0) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields and select students',
        severity: 'error',
      });
      return;
    }

    try {
      // Create task first
      const taskResponse = await taskAPI.createTask({
        ...taskForm,
      });

      const taskId = (taskResponse.data.data as { _id: string })._id;

      // Assign task to selected students
      await taskAPI.assignTask(taskId, Array.from(selectedStudents));

      setSnackbar({
        open: true,
        message: `Task assigned to ${selectedStudents.size} student(s)`,
        severity: 'success',
      });

      // Reset form
      setTaskForm({
        title: '',
        description: '',
        courseId: '',
        taskType: 'assignment',
        dueDate: '',
        instructions: '',
        totalMarks: 0,
      });
      setTaskDialogOpen(false);
      setSelectedStudents(new Set());
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to assign task',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="500px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Student Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your students and assign tasks
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {selectedStudents.size > 0 && (
            <Button
              variant="contained"
              startIcon={<TaskIcon />}
              onClick={handleBulkAssignTask}
              sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              Assign Task ({selectedStudents.size})
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {students.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Selected
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {selectedStudents.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search students by name, email, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
        </Box>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderTop: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${students.length})`} />
          <Tab label={`Class A`} />
          <Tab label={`Class B`} />
          <Tab label={`Class C`} />
        </Tabs>
      </Paper>

      {/* Students Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length}
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>USN / Roll No.</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentId = student._id || student.id;
                  return (
                  <TableRow key={studentId} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedStudents.has(studentId)}
                        onChange={() => handleSelectStudent(studentId)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>
                            {student.firstName} {student.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getClassLetter(student)} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{student.studentId || student.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{student.phoneNumber}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, student)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? 'No students match your search' : 'No students found. Students must complete their profiles first.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleAssignTask}>
          <TaskIcon fontSize="small" sx={{ mr: 1 }} /> Assign Task
        </MenuItem>
      </Menu>

      {/* Task Assignment Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create & Assign Task ({selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''})
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title *"
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course ID"
                value={taskForm.courseId}
                onChange={(e) => setTaskForm({ ...taskForm, courseId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Task Type"
                value={taskForm.taskType}
                onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
              >
                <MenuItem value="assignment">Assignment</MenuItem>
                <MenuItem value="homework">Homework</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="reading">Reading</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date *"
                type="date"
                required
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={taskForm.totalMarks}
                onChange={(e) => setTaskForm({ ...taskForm, totalMarks: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={2}
                value={taskForm.instructions}
                onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAndAssignTask}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            Assign Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EducatorStudentManagement;
