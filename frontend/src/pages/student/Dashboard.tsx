/**
 * 🎓 Academic Intelligence Platform - Student Dashboard
 * Connected to real backend API
 */

import React, { useEffect, useState } from 'react';
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
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '@/store';
import { analyticsAPI, examAPI, getAccessToken } from '@/services/api';
import GoalTracker from '@/components/GoalTracker';
import PersonalizedFeedback from '@/components/PersonalizedFeedback';
import LearningGapsView from '@/components/LearningGapsView';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}20`,
            color: color,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {trend !== undefined && (
        <Box display="flex" alignItems="center" mt={1}>
          <TrendingUpIcon
            sx={{
              fontSize: 16,
              color: trend >= 0 ? '#10b981' : '#ef4444',
              transform: trend < 0 ? 'rotate(180deg)' : 'none',
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: trend >= 0 ? '#10b981' : '#ef4444', ml: 0.5 }}
          >
            {Math.abs(trend)}% from last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardData {
  overview: {
    totalExams: number;
    avgScore: number;
    avgPercentage: number;
    totalCorrect: number;
    totalWrong: number;
    passRate: number;
  };
  recentPerformance: Array<{
    examId: string;
    examTitle: string;
    score: number;
    percentage: number;
    grade: string;
    passed: boolean;
    submittedAt: string;
  }>;
  performanceTrend: Array<{
    attemptNumber: number;
    percentage: number;
    date: string;
  }>;
  chapterAnalysis: Array<{
    chapter: string;
    accuracy: number;
    totalQuestions: number;
  }>;
}

interface UpcomingExamItem {
  id: number | string;
  title: string;
  startTime: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const activeCourseId = (user as any)?.currentCourseId || (user as any)?.courseId;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const formatUpcomingDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      // Check for valid token and user before making API calls
      const token = getAccessToken();
      if (!token || !user?.id || hasFetched) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setHasFetched(true);
      
      try {
        const [dashboardResult, examsResult] = await Promise.allSettled([
          analyticsAPI.getStudentDashboard(user.id as number),
          examAPI.getAvailableExams(),
        ]);

        if (dashboardResult.status === 'fulfilled' && dashboardResult.value.data.success) {
          setDashboardData(dashboardResult.value.data.data as DashboardData);
        }

        if (examsResult.status === 'fulfilled' && examsResult.value.data.success) {
          const examsPayload = examsResult.value.data.data as any;
          const examsArray = Array.isArray(examsPayload)
            ? examsPayload
            : Array.isArray(examsPayload?.exams)
              ? examsPayload.exams
              : [];

          const now = new Date();
          const upcoming = examsArray
            .filter((exam: any) => {
              const scheduledAt = exam.startTime || exam.scheduledAt;
              if (!scheduledAt) return false;

              const status = exam.status;
              const isUpcomingStatus = status === 'scheduled' || status === 'published' || status === 'active';
              return isUpcomingStatus && new Date(scheduledAt) > now;
            })
            .sort((a: any, b: any) => {
              const aDate = new Date(a.startTime || a.scheduledAt).getTime();
              const bDate = new Date(b.startTime || b.scheduledAt).getTime();
              return aDate - bDate;
            })
            .slice(0, 3)
            .map((exam: any) => ({
              id: exam.id,
              title: exam.title,
              startTime: exam.startTime || exam.scheduledAt,
            }));

          setUpcomingExams(upcoming);
        } else {
          setUpcomingExams([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        // Don't show error if it's an auth error - let the interceptor handle it
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Failed to load dashboard data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id, hasFetched]);

  // Transform data for charts
  const performanceTrend = dashboardData?.performanceTrend?.map((item, index) => ({
    month: `Exam ${index + 1}`,
    score: Math.round(item.percentage),
  })) || [];

  const subjectPerformance = dashboardData?.chapterAnalysis?.slice(0, 4).map(item => ({
    name: item.chapter,
    value: Math.round(item.accuracy),
  })) || [];

  const recentActivity = dashboardData?.recentPerformance?.map(item => ({
    id: item.examId,
    title: item.examTitle,
    score: Math.round(item.percentage),
    date: new Date(item.submittedAt).toLocaleDateString(),
    status: 'completed',
  })) || [];

  const learningGaps = dashboardData?.chapterAnalysis
    ?.filter(c => c.accuracy < 70)
    .map(c => ({
      topic: c.chapter,
      chapter: `${c.totalQuestions} questions`,
      severity: c.accuracy < 40 ? 'high' : c.accuracy < 60 ? 'medium' : 'low',
    })) || [];

  if (isLoading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}. Please try again later.
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  const overview = dashboardData?.overview || {
    totalExams: 0,
    avgPercentage: 0,
    passRate: 0,
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your academic performance overview
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overall Score"
            value={`${Math.round(overview.avgPercentage || 0)}%`}
            subtitle="Across all exams"
            icon={<TrophyIcon />}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Exams Completed"
            value={overview.totalExams || 0}
            subtitle="Total attempts"
            icon={<AssignmentIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pass Rate"
            value={`${Math.round(overview.passRate || 0)}%`}
            subtitle="Success rate"
            icon={<TimerIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Correct Answers"
            value={dashboardData?.overview?.totalCorrect || 0}
            subtitle="Total correct"
            icon={<SchoolIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Performance Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Performance Trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your score progression over time
                </Typography>
              </Box>
              <Chip label="Last 6 months" size="small" />
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Subject Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              Subject Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Score distribution by subject
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={subjectPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box mt={2}>
              {subjectPerformance.map((subject, index) => (
                <Box
                  key={subject.name}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 1,
                        bgcolor: COLORS[index],
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2">{subject.name}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {subject.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Upcoming Exams */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Upcoming Exams
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/student/exams')}
              >
                View All
              </Button>
            </Box>
            <List disablePadding>
              {upcomingExams.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
                  No upcoming exams scheduled
                </Typography>
              ) : (
                upcomingExams.map((exam) => {
                  const formatted = formatUpcomingDateTime(exam.startTime);
                  return (
                    <ListItem
                      key={exam.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={exam.title}
                        secondary={`${formatted.date} at ${formatted.time}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  );
                })
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Recent Activity
            </Typography>
            <List disablePadding>
              {recentActivity.map((activity) => (
                <ListItem
                  key={activity.id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <CheckCircleIcon color="success" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.title}
                    secondary={activity.date}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Chip
                    label={`${activity.score}%`}
                    size="small"
                    color={activity.score >= 80 ? 'success' : 'warning'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Learning Gaps */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Areas to Improve
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/student/analytics')}
              >
                Details
              </Button>
            </Box>
            <List disablePadding>
              {learningGaps.map((gap, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 2,
                    py: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: gap.severity === 'high' ? 'error.50' : 'grey.50',
                    border: gap.severity === 'high' ? '1px solid' : 'none',
                    borderColor: 'error.200',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          gap.severity === 'high'
                            ? 'error.light'
                            : gap.severity === 'medium'
                            ? 'warning.light'
                            : 'info.light',
                      }}
                    >
                      <WarningIcon
                        color={
                          gap.severity === 'high'
                            ? 'error'
                            : gap.severity === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                      />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={gap.topic}
                    secondary={gap.chapter}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Chip
                    label={gap.severity}
                    size="small"
                    color={
                      gap.severity === 'high'
                        ? 'error'
                        : gap.severity === 'medium'
                        ? 'warning'
                        : 'info'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Phase 3 Features - New AI-Powered Analytics */}
      <Box mt={4}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
          🤖 AI-Powered Insights
        </Typography>
        
        {/* Personalized Feedback Section */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                💬 Personalized Feedback
              </Typography>
              <PersonalizedFeedback courseId={activeCourseId ?? 1} />
            </Paper>
          </Grid>
        </Grid>

        {/* Learning Gaps Section */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                🎯 Learning Gap Analysis
              </Typography>
              <LearningGapsView courseId={activeCourseId} />
            </Paper>
          </Grid>
        </Grid>

        {/* Goals Section */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                🎯 My Learning Goals
              </Typography>
              <GoalTracker courseId={activeCourseId} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
