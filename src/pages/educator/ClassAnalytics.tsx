/**
 * 🎓 Academic Intelligence Platform - Class Analytics Page
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
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Lightbulb as LightbulbIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

const ClassAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuthStore();
  const { 
    classAnalytics, 
    atRiskStudents,
    classWeakAreas,
    isLoading,
    error,
    fetchClassAnalytics,
    fetchAtRiskStudents,
    fetchClassWeakAreas,
    clearError,
  } = useAnalyticsStore();

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      // Using courseId=1 as default - in production, this would be selected
      fetchClassAnalytics(1, Number(user.id));
      fetchAtRiskStudents(1, 60);
      fetchClassWeakAreas(1);
    }
  }, [user?.id, fetchClassAnalytics, fetchAtRiskStudents, fetchClassWeakAreas]);

  const handleRetry = () => {
    clearError();
    if (user?.id) {
      fetchClassAnalytics(1, Number(user.id));
      fetchAtRiskStudents(1, 60);
      fetchClassWeakAreas(1);
    }
  };

  // Generate performance trend data
  const getPerformanceTrend = () => {
    if (classAnalytics?.performanceByMonth) {
      return classAnalytics.performanceByMonth;
    }
    return [];
  };

  // Generate chapter performance data
  const getChapterPerformance = () => {
    if (classAnalytics?.chapterPerformance) {
      return classAnalytics.chapterPerformance;
    }
    return [];
  };

  // Generate grade distribution data
  const getGradeDistribution = () => {
    if (classAnalytics?.gradeDistribution) {
      // Handle both array format and object format
      if (Array.isArray(classAnalytics.gradeDistribution)) {
        return classAnalytics.gradeDistribution.map((item: any) => ({
          name: item.grade || item.name,
          value: item.count || item.value || 0,
        }));
      }
      return Object.entries(classAnalytics.gradeDistribution).map(([grade, countObj]) => ({
        name: grade,
        value: typeof countObj === 'number' ? countObj : (countObj as any).count || 0,
      }));
    }
    return [];
  };

  // Generate concept mastery data
  const getConceptMastery = () => {
    if (classAnalytics?.conceptMastery) {
      return classAnalytics.conceptMastery;
    }
    return [];
  };

  // Get at-risk students list
  const getAtRiskStudentsList = () => {
    if (atRiskStudents && atRiskStudents.length > 0) {
      return atRiskStudents.map((student: any) => ({
        name: `${student.firstName || ''} ${student.lastName || student.name || ''}`.trim() || 'Student',
        score: student.averageScore || student.score || 0,
        trend: student.trend || 0,
        subject: student.weakArea || 'General',
      }));
    }
    return [];
  };

  // Get common mistakes/weak areas
  const getCommonMistakes = () => {
    if (classWeakAreas && classWeakAreas.length > 0) {
      return classWeakAreas.map((area: any) => ({
        topic: area.conceptName || area.chapterName || area.name || 'Unknown',
        errorRate: area.errorRate || area.avgAccuracy ? (100 - area.avgAccuracy) : 0,
        students: area.affectedStudents || area.studentCount || 0,
      }));
    }
    return [];
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
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Class Analytics</Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive insights into your class performance
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #6366f115 0%, #6366f105 100%)', border: '1px solid #6366f120' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {classAnalytics?.totalStudents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98105 100%)', border: '1px solid #10b98120' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Class Average</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {Math.round(classAnalytics?.averageScore || 0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f59e0b15 0%, #f59e0b05 100%)', border: '1px solid #f59e0b20' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Pass Rate</Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {Math.round(classAnalytics?.passRate || 0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ef444415 0%, #ef444405 100%)', border: '1px solid #ef444420' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">At-Risk Students</Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {getAtRiskStudentsList().length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Performance Trend" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Chapter Analysis" icon={<SchoolIcon />} iconPosition="start" />
          <Tab label="At-Risk Students" icon={<WarningIcon />} iconPosition="start" />
          <Tab label="Insights" icon={<LightbulbIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Performance Trend */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Performance Trend</Typography>
              {getPerformanceTrend().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getPerformanceTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={3} name="Avg Score" />
                    <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No trend data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Grade Distribution</Typography>
              {getGradeDistribution().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getGradeDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {getGradeDistribution().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No grade data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Chapter Analysis */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Chapter-wise Performance</Typography>
              {getChapterPerformance().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChapterPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="chapter" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#6366f1" name="Avg Score" />
                    <Bar dataKey="completion" fill="#10b981" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No chapter performance data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Concept Mastery</Typography>
              {getConceptMastery().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={getConceptMastery()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="concept" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No concept mastery data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* At-Risk Students */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Students Needing Attention ({getAtRiskStudentsList().length})
          </Typography>
          {getAtRiskStudentsList().length > 0 ? (
            <List>
              {getAtRiskStudentsList().map((student: any, index: number) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: 'error.50',
                    border: '1px solid',
                    borderColor: 'error.200',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light' }}>{student.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={student.name}
                    secondary={`Weak Area: ${student.subject}`}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Box textAlign="right">
                    <Typography variant="h6" color="error">{Math.round(student.score)}%</Typography>
                    <Chip
                      size="small"
                      icon={student.trend < 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                      label={`${student.trend > 0 ? '+' : ''}${student.trend}%`}
                      color={student.trend < 0 ? 'error' : 'success'}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">No at-risk students identified</Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Insights */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Common Weak Areas</Typography>
              </Box>
              {getCommonMistakes().length > 0 ? (
                <List>
                  {getCommonMistakes().map((item: any, index: number) => (
                    <ListItem
                      key={index}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'warning.50',
                        border: '1px solid',
                        borderColor: 'warning.200',
                      }}
                    >
                      <ListItemText
                        primary={item.topic}
                        secondary={`${item.students} students affected`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={`${Math.round(item.errorRate)}% error rate`}
                        color="warning"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">No weak areas identified</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LightbulbIcon color="success" />
                <Typography variant="h6" fontWeight={600}>Recommendations</Typography>
              </Box>
              <List>
                {classAnalytics?.recommendations && classAnalytics.recommendations.length > 0 ? (
                  classAnalytics.recommendations.map((rec: string, index: number) => (
                    <ListItem key={index} sx={{ mb: 1, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      Complete more exams to receive personalized recommendations
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default ClassAnalytics;
