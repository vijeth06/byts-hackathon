/**
 * 🎓 Academic Intelligence Platform - Student Progress Page
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore, useAnalyticsStore } from '@/store';
import { analyticsAPI } from '@/services/api';

interface Student {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  studentId?: string;
  rollNumber?: string;
  averageScore: number;
  totalExams: number;
  trend: number;
  lastActive?: string;
}

interface StudentDetail {
  student: Student;
  examHistory: Array<{
    examId: string;
    examTitle: string;
    score: number;
    date: string;
    grade: string;
    timeAttended?: number;
    timeFormatted?: string;
  }>;
  performanceTrend: Array<{
    month: string;
    score: number;
  }>;
}

const StudentProgress: React.FC = () => {
  const { user } = useAuthStore();
  const { classAnalytics, fetchClassAnalytics, isLoading, error, clearError } = useAnalyticsStore();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch class analytics on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !user?.id || !token) return;
    setHasFetched(true);
    fetchClassAnalytics(1, Number(user.id));
  }, [hasFetched, user?.id]);

  // Extract students from class analytics
  useEffect(() => {
    if (classAnalytics?.students) {
      const studentList = classAnalytics.students.map((s: any) => ({
        id: s.id || s._id,
        firstName: s.firstName || '',
        lastName: s.lastName || '',
        email: s.email || '',
        phoneNumber: s.phoneNumber,
        studentId: s.studentId,
        rollNumber: s.rollNumber,
        averageScore: s.averageScore || 0,
        totalExams: s.totalExams || s.examsTaken || 0,
        trend: s.trend || 0,
        lastActive: s.lastActive,
      }));
      setStudents(studentList);
      setFilteredStudents(studentList);
    }
  }, [classAnalytics]);

  // Filter students based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
    setDetailLoading(true);
    
    try {
      // Fetch detailed analytics for the student
      const response = await analyticsAPI.getStudentDashboard(Number(student.id), 1);
      const data = response.data.data as any;
      
      setStudentDetail({
        student,
        examHistory: data.recentExams || [],
        performanceTrend: data.performanceTrend?.dataPoints || [],
      });
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      setStudentDetail({
        student,
        examHistory: [],
        performanceTrend: [],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleRetry = () => {
    clearError();
    if (user?.id) {
      fetchClassAnalytics(1, Number(user.id));
    }
  };

  if (isLoading && students.length === 0) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Student Progress</Typography>
          <Typography variant="body1" color="text.secondary">
            Track and analyze individual student performance ({students.length} students)
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #6366f115 0%, #6366f105 100%)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
              <Typography variant="h4" fontWeight={700} color="primary">{students.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98105 100%)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Above Average</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {students.filter((s) => s.averageScore >= (classAnalytics?.averageScore || 70)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f59e0b15 0%, #f59e0b05 100%)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Improving</Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {students.filter((s) => s.trend > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ef444415 0%, #ef444405 100%)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Need Attention</Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {students.filter((s) => s.averageScore < 60).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Students Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell align="center">USN / Roll No.</TableCell>
              <TableCell align="center">Phone</TableCell>
              <TableCell align="center">Average Score</TableCell>
              <TableCell align="center">Exams Taken</TableCell>
              <TableCell align="center">Trend</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        {student.firstName[0]}{student.lastName[0]}
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
                  <TableCell align="center">
                    <Typography variant="body2">{student.studentId || student.rollNumber || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{student.phoneNumber || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${Math.round(student.averageScore)}%`}
                      color={getGradeColor(student.averageScore) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{student.totalExams}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      icon={student.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      label={`${student.trend > 0 ? '+' : ''}${student.trend}%`}
                      color={student.trend >= 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<AssessmentIcon />}
                      onClick={() => handleViewStudent(student)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                  <Typography color="text.secondary">
                    {searchQuery ? 'No students match your search' : 'No student data available'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Student Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedStudent?.firstName[0]}{selectedStudent?.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedStudent?.email}
              </Typography>
              {(selectedStudent?.studentId || selectedStudent?.rollNumber) && (
                <Typography variant="body2" color="text.secondary">
                  USN / Roll No: {selectedStudent.studentId || selectedStudent.rollNumber}
                </Typography>
              )}
              {selectedStudent?.phoneNumber && (
                <Typography variant="body2" color="text.secondary">
                  Phone: {selectedStudent.phoneNumber}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box py={4}>
              <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={200} />
            </Box>
          ) : (
            <>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Performance Trend" />
                <Tab label="Exam History" />
              </Tabs>

              {tabValue === 0 && (
                <>
                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          {Math.round(selectedStudent?.averageScore || 0)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Average Score</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          {selectedStudent?.totalExams || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Exams Taken</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography 
                          variant="h4" 
                          fontWeight={700} 
                          color={(selectedStudent?.trend || 0) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {(selectedStudent?.trend || 0) > 0 ? '+' : ''}{selectedStudent?.trend || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Trend</Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {studentDetail?.performanceTrend && studentDetail.performanceTrend.length > 0 ? (
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Score Trend Over Time</Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={studentDetail.performanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">No trend data available</Typography>
                    </Box>
                  )}
                </>
              )}

              {tabValue === 1 && (
                studentDetail?.examHistory && studentDetail.examHistory.length > 0 ? (
                  <List>
                    {studentDetail.examHistory.map((exam, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box flex={1}>
                          <Typography fontWeight={500} mb={0.5}>{exam.examTitle}</Typography>
                          <Box display="flex" gap={2} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {new Date(exam.date).toLocaleDateString()}
                            </Typography>
                            {exam.timeAttended && (
                              <Chip 
                                label={`${exam.timeAttended} min attended`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={`${exam.score}%`}
                            color={getGradeColor(exam.score) as any}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Grade: {exam.grade}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">No exam history available</Typography>
                  </Box>
                )
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProgress;
