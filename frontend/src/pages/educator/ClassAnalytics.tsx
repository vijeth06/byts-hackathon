/**
 * 🎓 Academic Intelligence Platform - Class Analytics Page
 * Enhanced version with comprehensive student performance data
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
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuthStore, useAnalyticsStore } from '@/store';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box pt={3}>{children}</Box>}</div>
);

interface StudentPerformance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  studentId?: string;
  rollNumber?: string;
  currentSemester?: number;
  department?: { name: string; code: string };
  section?: { name: string };
  averageScore: number;
  examsAttempted: number;
  examsTaken: number;
  totalExams: number;
  passRate: number;
  totalCorrect: number;
  totalWrong: number;
  trend: number;
  weakArea: string;
  examHistory?: Array<{
    examTitle: string;
    score: number;
    date?: string;
    timeAttended?: number;
  }>;
}

const ClassAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof StudentPerformance>('averageScore');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { user } = useAuthStore();
  const { 
    classAnalytics, 
    atRiskStudents,
    isLoading,
    error,
    fetchClassAnalytics,
    fetchAtRiskStudents,
    clearError,
  } = useAnalyticsStore();

  const [hasFetched, setHasFetched] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !user?.id || !token) return;
    setHasFetched(true);
    fetchClassAnalytics(1, Number(user.id));
    fetchAtRiskStudents(60);
  }, [hasFetched, user?.id]);

  const handleRetry = () => {
    clearError();
    if (user?.id) {
      fetchClassAnalytics(1, Number(user.id));
      fetchAtRiskStudents(60);
    }
  };

  // Get students list
  const getStudentsList = (): StudentPerformance[] => {
    if (classAnalytics?.students) {
      return classAnalytics.students;
    }
    return [];
  };

  // Filter and sort students
  const getFilteredStudents = () => {
    let students = getStudentsList();
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      students = students.filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }

    students.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    return students;
  };

  const handleSort = (property: keyof StudentPerformance) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleViewStudent = (student: StudentPerformance) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  // Get performance trend data
  const getPerformanceTrend = () => {
    if (classAnalytics?.performanceByMonth) {
      return classAnalytics.performanceByMonth;
    }
    return [];
  };

  // Get exam analytics
  const getExamAnalytics = () => {
    if (classAnalytics?.examAnalytics) {
      return classAnalytics.examAnalytics;
    }
    return [];
  };

  // Get grade distribution data
  const getGradeDistribution = () => {
    if (classAnalytics?.gradeDistribution) {
      if (Array.isArray(classAnalytics.gradeDistribution)) {
        return classAnalytics.gradeDistribution.map((item: any) => ({
          name: item.grade || item.name,
          value: item.count || item.value || 0,
        }));
      }
      return Object.entries(classAnalytics.gradeDistribution).map(([grade, count]) => ({
        name: grade,
        value: typeof count === 'number' ? count : 0,
      }));
    }
    return [];
  };

  // Get at-risk students list
  const getAtRiskStudentsList = () => {
    if (classAnalytics?.atRiskStudents && classAnalytics.atRiskStudents.length > 0) {
      return classAnalytics.atRiskStudents;
    }
    if (atRiskStudents && atRiskStudents.length > 0) {
      return atRiskStudents;
    }
    return [];
  };

  // Get top performers
  const getTopPerformers = () => {
    if (classAnalytics?.topPerformers) {
      return classAnalytics.topPerformers;
    }
    return getStudentsList().slice(0, 5);
  };

  // Get recommendations
  const getRecommendations = () => {
    if (classAnalytics?.recommendations) {
      return classAnalytics.recommendations;
    }
    return [];
  };

  // Score color helpers
  const getScoreColorHex = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading && !classAnalytics) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
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
      <Box mb={{ xs: 2, md: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
          Class Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
          Comprehensive insights into your students' performance
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} mb={{ xs: 2, md: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #6366f115 0%, #6366f105 100%)', border: '1px solid #6366f120' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PersonIcon sx={{ color: '#6366f1', fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Total Students</Typography>
              </Box>
              <Typography fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {classAnalytics?.totalStudents || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {classAnalytics?.totalAttempts || 0} exam attempts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98105 100%)', border: '1px solid #10b98120' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrophyIcon sx={{ color: '#10b981', fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Class Average</Typography>
              </Box>
              <Typography fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {Math.round(classAnalytics?.averageScore || 0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {classAnalytics?.totalExams || 0} exams conducted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f59e0b15 0%, #f59e0b05 100%)', border: '1px solid #f59e0b20' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleIcon sx={{ color: '#f59e0b', fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Pass Rate</Typography>
              </Box>
              <Typography fontWeight={700} color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {Math.round(classAnalytics?.passRate || 0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students passing exams
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ef444415 0%, #ef444405 100%)', border: '1px solid #ef444420' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WarningIcon sx={{ color: '#ef4444', fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>At-Risk Students</Typography>
              </Box>
              <Typography fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {getAtRiskStudentsList().length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Below 60% average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: { xs: 2, md: 3 } }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 1.5, sm: 2 },
            },
          }}
        >
          <Tab label="Students" icon={<PersonIcon sx={{ display: { xs: 'none', sm: 'block' } }} />} iconPosition="start" />
          <Tab label="Exams" icon={<AssignmentIcon sx={{ display: { xs: 'none', sm: 'block' } }} />} iconPosition="start" />
          <Tab label="Trends" icon={<TrendingUpIcon sx={{ display: { xs: 'none', sm: 'block' } }} />} iconPosition="start" />
          <Tab label="At-Risk" icon={<WarningIcon sx={{ display: { xs: 'none', sm: 'block' } }} />} iconPosition="start" />
          <Tab label="Insights" icon={<LightbulbIcon sx={{ display: { xs: 'none', sm: 'block' } }} />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab 0: Student Performance Table */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Typography variant="h6" fontWeight={600}>Student Performance</Typography>
            <TextField
              size="small"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
              sx={{ minWidth: 250 }}
            />
          </Box>
          
          {getFilteredStudents().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'firstName'}
                        direction={orderBy === 'firstName' ? order : 'asc'}
                        onClick={() => handleSort('firstName')}
                      >
                        Student
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'rollNumber'}
                        direction={orderBy === 'rollNumber' ? order : 'asc'}
                        onClick={() => handleSort('rollNumber' as keyof StudentPerformance)}
                      >
                        USN / Roll No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Phone</TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'examsAttempted'}
                        direction={orderBy === 'examsAttempted' ? order : 'asc'}
                        onClick={() => handleSort('examsAttempted')}
                      >
                        Exams Taken
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'averageScore'}
                        direction={orderBy === 'averageScore' ? order : 'asc'}
                        onClick={() => handleSort('averageScore')}
                      >
                        Avg Score
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'passRate'}
                        direction={orderBy === 'passRate' ? order : 'asc'}
                        onClick={() => handleSort('passRate')}
                      >
                        Pass Rate
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'trend'}
                        direction={orderBy === 'trend' ? order : 'asc'}
                        onClick={() => handleSort('trend')}
                      >
                        Trend
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredStudents().map((student, index) => (
                    <TableRow key={student.id || index} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: getScoreColorHex(student.averageScore), width: 40, height: 40 }}>
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={500}>{student.firstName} {student.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{student.email}</Typography>
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
                        <Box>
                          <Typography fontWeight={500}>{student.examsAttempted || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            of {student.totalExams || classAnalytics?.totalExams || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <Box sx={{ width: 60 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={student.averageScore} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: `${getScoreColorHex(student.averageScore)}30`,
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getScoreColorHex(student.averageScore),
                                  borderRadius: 4,
                                }
                              }}
                            />
                          </Box>
                          <Typography fontWeight={600} color={getScoreColorHex(student.averageScore)}>
                            {Math.round(student.averageScore)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${student.passRate || 0}%`}
                          size="small"
                          color={student.passRate >= 70 ? 'success' : student.passRate >= 50 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          {student.trend >= 0 ? (
                            <TrendingUpIcon sx={{ color: '#10b981', fontSize: 18 }} />
                          ) : (
                            <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ color: student.trend >= 0 ? '#10b981' : '#ef4444' }}
                          >
                            {student.trend > 0 ? '+' : ''}{student.trend}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={student.weakArea || 'Good'}
                          size="small"
                          color={
                            student.weakArea === 'Good' ? 'success' :
                            student.weakArea === 'Average' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewStudent(student)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={8}>
              <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography color="text.secondary">
                {searchQuery ? 'No students match your search' : 'No student performance data available yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Students will appear here once they take exams
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Tab 1: Exam Analytics */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Exam Performance Overview</Typography>
          
          {getExamAnalytics().length > 0 ? (
            <>
              <TableContainer sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Exam</TableCell>
                      <TableCell align="center">Attendance</TableCell>
                      <TableCell align="center">Avg Score</TableCell>
                      <TableCell align="center">Pass Rate</TableCell>
                      <TableCell align="center">Highest</TableCell>
                      <TableCell align="center">Lowest</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getExamAnalytics().map((exam: any, index: number) => (
                      <TableRow key={exam.examId || index} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                              <AssignmentIcon fontSize="small" />
                            </Avatar>
                            <Typography fontWeight={500}>{exam.examTitle}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography fontWeight={500}>{exam.totalAttempts}/{exam.totalStudents}</Typography>
                            <Chip 
                              label={`${exam.attendanceRate}%`}
                              size="small"
                              color={exam.attendanceRate >= 80 ? 'success' : exam.attendanceRate >= 50 ? 'warning' : 'error'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={600} color={getScoreColorHex(exam.avgScore)}>
                            {Math.round(exam.avgScore)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${exam.passRate}%`}
                            size="small"
                            color={exam.passRate >= 70 ? 'success' : exam.passRate >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography color="success.main" fontWeight={500}>{Math.round(exam.highestScore)}%</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography color="error.main" fontWeight={500}>{Math.round(exam.lowestScore)}%</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Exam Performance Chart */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Average Scores by Exam</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getExamAnalytics()} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="examTitle" 
                      tick={{ fontSize: 11 }} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                    />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#6366f1" name="Avg Score" />
                    <Bar dataKey="attendanceRate" fill="#10b981" name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </>
          ) : (
            <Box textAlign="center" py={8}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography color="text.secondary">No exam data available yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create and conduct exams to see analytics here
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Tab 2: Performance Trends */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Performance Trend</Typography>
              {getPerformanceTrend().length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPerformanceTrend()} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={35} />
                      <ChartTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={3} name="Avg Score" />
                      <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="Submissions" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No trend data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Grade Distribution</Typography>
              {getGradeDistribution().length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getGradeDistribution()}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {getGradeDistribution().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No grade data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: At-Risk Students */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
            Students Needing Attention ({getAtRiskStudentsList().length})
          </Typography>
          
          {getAtRiskStudentsList().length > 0 ? (
            <List sx={{ p: 0 }}>
              {getAtRiskStudentsList().map((student: any, index: number) => (
                <ListItem
                  key={student.id || index}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'error.50',
                    border: '1px solid',
                    borderColor: 'error.200',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography fontWeight={600}>{student.firstName} {student.lastName}</Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {student.email}
                        </Typography>
                        <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                          Status: {student.weakArea || 'Needs Improvement'} • {student.examsAttempted || 0} exams taken
                        </Typography>
                      </Box>
                    }
                  />
                  <Box textAlign="right">
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      {Math.round(student.averageScore)}%
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} justifyContent="flex-end">
                      {student.trend >= 0 ? (
                        <TrendingUpIcon sx={{ color: '#10b981', fontSize: 16 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                      )}
                      <Typography variant="caption" sx={{ color: student.trend >= 0 ? '#10b981' : '#ef4444' }}>
                        {student.trend > 0 ? '+' : ''}{student.trend}%
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={8}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography color="text.secondary">No at-risk students identified</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                All students are performing above the 60% threshold
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Tab 4: Insights & Recommendations */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* Top Performers */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <StarIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" fontWeight={600}>Top Performers</Typography>
              </Box>
              {getTopPerformers().length > 0 ? (
                <List sx={{ p: 0 }}>
                  {getTopPerformers().map((student: any, index: number) => (
                    <ListItem
                      key={student.id || index}
                      sx={{
                        mb: 1,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: index === 0 ? 'warning.50' : 'success.50',
                        border: '1px solid',
                        borderColor: index === 0 ? 'warning.200' : 'success.200',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                          #{index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={`${student.examsAttempted || 0} exams • ${student.passRate || 0}% pass rate`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={`${Math.round(student.averageScore)}%`}
                        color="success"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">No performance data yet</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LightbulbIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={600}>Recommendations</Typography>
              </Box>
              {getRecommendations().length > 0 ? (
                <List sx={{ p: 0 }}>
                  {getRecommendations().map((rec: any, index: number) => (
                    <ListItem
                      key={index}
                      sx={{
                        mb: 1,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.50',
                        border: '1px solid',
                        borderColor: 'primary.200',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={typeof rec === 'string' ? rec : (rec?.title || rec?.name || rec?.description || 'Recommendation')}
                        secondary={typeof rec === 'object' && rec?.description ? rec.description : undefined}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    Complete more exams to receive personalized recommendations
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Student Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: selectedStudent ? getScoreColorHex(selectedStudent.averageScore) : 'grey', width: 48, height: 48 }}>
              {selectedStudent?.firstName?.[0]}{selectedStudent?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedStudent?.firstName} {selectedStudent?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedStudent?.email}</Typography>
              {(selectedStudent?.studentId || selectedStudent?.rollNumber) && (
                <Typography variant="body2" color="text.secondary">USN / Roll No: {selectedStudent.studentId || selectedStudent.rollNumber}</Typography>
              )}
              {selectedStudent?.phoneNumber && (
                <Typography variant="body2" color="text.secondary">Phone: {selectedStudent.phoneNumber}</Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'grey.50', p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Average Score</Typography>
                  <Typography variant="h4" fontWeight={700} color={getScoreColorHex(selectedStudent.averageScore)}>
                    {Math.round(selectedStudent.averageScore)}%
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'grey.50', p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Exams Taken</Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {selectedStudent.examsAttempted}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'grey.50', p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Pass Rate</Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {selectedStudent.passRate}%
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'grey.50', p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Performance Trend</Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {selectedStudent.trend >= 0 ? (
                      <TrendingUpIcon sx={{ color: '#10b981', fontSize: 32 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 32 }} />
                    )}
                    <Typography variant="h4" fontWeight={700} sx={{ color: selectedStudent.trend >= 0 ? '#10b981' : '#ef4444' }}>
                      {selectedStudent.trend > 0 ? '+' : ''}{selectedStudent.trend}%
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Accuracy</Typography>
                  <Box display="flex" gap={4}>
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        {selectedStudent.totalCorrect}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Correct</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="error.main">
                        {selectedStudent.totalWrong}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Wrong</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Alert severity={selectedStudent.averageScore >= 60 ? 'success' : 'warning'}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedStudent.weakArea || 'Good'}
                    {selectedStudent.averageScore < 60 && ' - This student needs additional support'}
                  </Typography>
                </Alert>
              </Grid>
              {selectedStudent.examHistory && selectedStudent.examHistory.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>Recent Exams</Typography>
                    <List sx={{ p: 0 }}>
                      {selectedStudent.examHistory.slice(0, 5).map((exam, index) => (
                        <ListItem 
                          key={index}
                          sx={{ py: 1, px: 0, borderBottom: index < (selectedStudent.examHistory?.length || 0) - 1 ? '1px solid #e5e7eb' : 'none' }}
                        >
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={500}>{exam.examTitle}</Typography>
                            <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {exam.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}
                              </Typography>
                              {exam.timeAttended && (
                                <Chip 
                                  label={`${exam.timeAttended}m`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          <Chip
                            label={`${exam.score}%`}
                            color={exam.score >= 70 ? 'success' : exam.score >= 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassAnalytics;
