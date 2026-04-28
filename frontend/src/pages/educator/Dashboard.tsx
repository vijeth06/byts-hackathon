/**
 * 🎓 Academic Intelligence Platform - Educator Dashboard
 * Production version - fetches real data from backend API
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore, useAnalyticsStore, useExamStore } from '@/store';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend, loading }) => (
  <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, border: `1px solid ${color}20` }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
          )}
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
      {trend !== undefined && (
        <Box display="flex" alignItems="center" mt={1}>
          <TrendingUpIcon sx={{ fontSize: 16, color: trend >= 0 ? '#10b981' : '#ef4444', transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
          <Typography variant="caption" sx={{ color: trend >= 0 ? '#10b981' : '#ef4444', ml: 0.5 }}>
            {Math.abs(trend)}% from last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classAnalytics, atRiskStudents, isLoading: analyticsLoading, fetchClassAnalytics, fetchAtRiskStudents, error: analyticsError, clearError } = useAnalyticsStore();
  const { exams, isLoadingExams, fetchExams, examsError } = useExamStore();
  
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeExams: 0,
    classAverage: 0,
    pendingReviews: 0,
  });
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch data on mount - only once
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !token) return;
    setHasFetched(true);
    
    const loadDashboardData = async () => {
      // Fetch exams for the educator
      await fetchExams({ status: 'published' });
      
      // Fetch class analytics and at-risk students
      if (user?.id) {
        await fetchClassAnalytics(1, Number(user.id));
        await fetchAtRiskStudents(60); // threshold of 60%
      }
    };
    
    loadDashboardData();
  }, [hasFetched]); // Only depend on hasFetched

  // Update stats when data changes
  useEffect(() => {
    if (classAnalytics) {
      setDashboardStats(prev => ({
        ...prev,
        totalStudents: classAnalytics.totalStudents || 0,
        classAverage: classAnalytics.averageScore || 0,
      }));
    }
    if (exams) {
      const activeCount = exams.filter((e: any) => e.status === 'published' || e.status === 'active').length;
      const pendingCount = exams.reduce((sum: number, e: any) => sum + (e.pendingSubmissions || 0), 0);
      setDashboardStats(prev => ({
        ...prev,
        activeExams: activeCount,
        pendingReviews: pendingCount,
      }));
    }
  }, [classAnalytics, exams]);

  // Generate chart data from analytics
  const getPerformanceData = () => {
    if (classAnalytics?.performanceByMonth) {
      return classAnalytics.performanceByMonth;
    }
    return [];
  };

  // Get recent exams
  const getRecentExams = () => {
    if (!exams || exams.length === 0) return [];
    return exams.slice(0, 3).map((exam: any) => ({
      name: exam.title,
      submissions: exam.totalSubmissions || 0,
      avgScore: exam.averageScore || 0,
      pending: exam.pendingSubmissions || 0,
    }));
  };

  // Get top performers from class analytics
  const getTopPerformers = () => {
    if (classAnalytics?.topPerformers) {
      return classAnalytics.topPerformers.slice(0, 3).map((student: any, index: number) => ({
        name: `${student.firstName || ''} ${student.lastName || student.name || ''}`.trim() || 'Student',
        score: student.averageScore || student.score || 0,
        rank: index + 1,
      }));
    }
    return [];
  };

  // Get at-risk students
  const getAtRiskStudents = () => {
    if (atRiskStudents && atRiskStudents.length > 0) {
      return atRiskStudents.slice(0, 3).map((student: any) => ({
        name: `${student.firstName || ''} ${student.lastName || student.name || ''}`.trim() || 'Student',
        score: student.averageScore || student.score || 0,
        trend: student.trend || 0,
        subject: student.courseName || 'Course',
      }));
    }
    return [];
  };

  const isLoading = analyticsLoading || isLoadingExams;
  const error = analyticsError || examsError;

  const handleRetry = () => {
    clearError();
    if (user?.id) {
      fetchClassAnalytics(1, Number(user.id));
      fetchAtRiskStudents(60);
    }
    fetchExams({ status: 'published' });
  };

  if (isLoading && !classAnalytics && !exams?.length) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
        <Box mt={3}>
          <Skeleton variant="rounded" height={300} />
        </Box>
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome, {user?.firstName}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your class overview and analytics
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/educator/exams')}
          sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          Create Exam
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Students" 
            value={dashboardStats.totalStudents} 
            subtitle="Enrolled students" 
            icon={<PeopleIcon />} 
            color="#6366f1" 
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Exams" 
            value={dashboardStats.activeExams} 
            subtitle="Published exams" 
            icon={<AssignmentIcon />} 
            color="#10b981" 
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Class Average" 
            value={`${Math.round(dashboardStats.classAverage)}%`} 
            subtitle="All subjects" 
            icon={<SchoolIcon />} 
            color="#f59e0b" 
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Reviews" 
            value={dashboardStats.pendingReviews} 
            subtitle="Submissions" 
            icon={<ScheduleIcon />} 
            color="#ef4444" 
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={600}>Class Performance Trend</Typography>
                <Typography variant="body2" color="text.secondary">Average scores over time</Typography>
              </Box>
              <Chip label="Recent data" size="small" />
            </Box>
            {getPerformanceData().length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={getPerformanceData()}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" name="Avg Score" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="body1" color="text.secondary">
                  No performance data available yet. Create exams and have students take them to see analytics.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Recent Exams</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/educator/exams')}>View All</Button>
            </Box>
            <List disablePadding>
              {getRecentExams().length > 0 ? (
                getRecentExams().map((exam: any, index: number) => (
                  <ListItem key={index} sx={{ px: 2, py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}><AssignmentIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={exam.name}
                      secondary={`${exam.submissions} submissions • Avg: ${exam.avgScore}%`}
                      primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                    />
                    {exam.pending > 0 && (
                      <Chip label={`${exam.pending} pending`} size="small" color="warning" />
                    )}
                  </ListItem>
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No exams created yet
                  </Typography>
                  <Button 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/educator/exams')}
                  >
                    Create your first exam
                  </Button>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Students Lists */}
      <Grid container spacing={3}>
        {/* At Risk Students */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon color="error" />
                <Typography variant="h6" fontWeight={600}>Students Needing Attention</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/educator/students')}>View All</Button>
            </Box>
            <List disablePadding>
              {getAtRiskStudents().length > 0 ? (
                getAtRiskStudents().map((student: any, index: number) => (
                  <ListItem key={index} sx={{ px: 2, py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'error.light' }}>{student.name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={student.name}
                      secondary={`${student.subject} • ${student.trend}% trend`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Chip label={`${Math.round(student.score)}%`} size="small" color="error" />
                  </ListItem>
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No at-risk students identified
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon color="success" />
                <Typography variant="h6" fontWeight={600}>Top Performers</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/educator/analytics')}>View All</Button>
            </Box>
            <List disablePadding>
              {getTopPerformers().length > 0 ? (
                getTopPerformers().map((student: any, index: number) => (
                  <ListItem key={index} sx={{ px: 2, py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 700 }}>#{student.rank}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={student.name} primaryTypographyProps={{ fontWeight: 500 }} />
                    <Chip label={`${Math.round(student.score)}%`} size="small" color="success" />
                  </ListItem>
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No performance data yet
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Intervention Tracking Section */}
      <Box mt={4}>
        <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/educator/interventions')}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                🎓 Student Intervention Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create, manage, and track student interventions
              </Typography>
            </Box>
            <Button variant="outlined" endIcon={<ArrowForwardIcon />}>
              View Interventions
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
