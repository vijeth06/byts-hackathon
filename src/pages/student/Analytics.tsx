/**
 * 🎓 Academic Intelligence Platform - Student Analytics Page
 * Production version - fetches real analytics from backend API
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useAnalyticsStore } from '@/store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box pt={3}>{children}</Box>}</div>
);

const AnalyticsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const {
    studentAnalytics,
    chapterPerformance,
    conceptMastery,
    difficultyAnalysis,
    performanceTrend,
    learningGaps,
    isLoading,
    error,
    fetchStudentAnalytics,
    fetchChapterPerformance,
    fetchConceptMastery,
    fetchDifficultyAnalysis,
    fetchPerformanceTrend,
    fetchLearningGaps,
    clearError,
  } = useAnalyticsStore();

  useEffect(() => {
    // Fetch all analytics data
    fetchStudentAnalytics();
    fetchChapterPerformance();
    fetchConceptMastery();
    fetchDifficultyAnalysis();
    fetchPerformanceTrend();
    fetchLearningGaps();
  }, [fetchStudentAnalytics, fetchChapterPerformance, fetchConceptMastery, fetchDifficultyAnalysis, fetchPerformanceTrend, fetchLearningGaps]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={400} sx={{ mb: 4 }} />
        <Grid container spacing={3} mb={4}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Calculate summary stats from actual data
  const overallScore = studentAnalytics?.overallScore || studentAnalytics?.averageScore || 0;
  const improvement = studentAnalytics?.improvement || 0;
  const currentGrade = studentAnalytics?.currentGrade || 'N/A';
  const gapCount = learningGaps?.length || 0;

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Performance Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning progress and identify areas for improvement
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <SchoolIcon color="primary" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{Math.round(overallScore)}%</Typography>
                  <Typography variant="body2" color="text.secondary">Overall Score</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: improvement >= 0 ? 'success.light' : 'error.light' }}>
                  <TrendingUpIcon color={improvement >= 0 ? 'success' : 'error'} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {improvement >= 0 ? '+' : ''}{Math.round(improvement)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Improvement</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <StarIcon color="info" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{currentGrade}</Typography>
                  <Typography variant="body2" color="text.secondary">Current Grade</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <WarningIcon color="warning" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{gapCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Learning Gaps</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Chapter Performance" />
          <Tab label="Concept Mastery" />
          <Tab label="Difficulty Analysis" />
          <Tab label="Progress Trend" />
          <Tab label="Learning Gaps" />
        </Tabs>
      </Paper>

      {/* Chapter Performance */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Performance by Chapter
          </Typography>
          {chapterPerformance && chapterPerformance.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={chapterPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#6366f1" name="Your Score" />
                  <Bar dataKey="target" fill="#e2e8f0" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="body1" color="text.secondary">
                No chapter performance data available yet. Complete some exams to see your progress.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Concept Mastery */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Concept Mastery Radar
          </Typography>
          {conceptMastery && conceptMastery.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <RadarChart data={conceptMastery}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="concept" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="body1" color="text.secondary">
                No concept mastery data available yet. Complete some exams to track your concept understanding.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Difficulty Analysis */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Performance by Difficulty
          </Typography>
          {difficultyAnalysis && difficultyAnalysis.length > 0 ? (
            <Grid container spacing={3}>
              {difficultyAnalysis.map((item: any) => (
                <Grid item xs={12} md={4} key={item.difficulty}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{item.difficulty}</Typography>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {item.correct} / {item.total} correct
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={item.total > 0 ? (item.correct / item.total) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="body1" color="text.secondary">
                No difficulty analysis data available yet. Complete some exams to see your performance by difficulty level.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Progress Trend */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Score Trend Over Time
          </Typography>
          {performanceTrend && performanceTrend.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="body1" color="text.secondary">
                No trend data available yet. Complete multiple exams over time to see your progress.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Learning Gaps */}
      <TabPanel value={tabValue} index={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Identified Learning Gaps
          </Typography>
          {learningGaps && learningGaps.length > 0 ? (
            <List>
              {learningGaps.map((gap: any, index: number) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: 2,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: `${getSeverityColor(gap.severity)}.light` }}>
                      <LightbulbIcon color={getSeverityColor(gap.severity) as any} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {gap.topic}
                        </Typography>
                        <Chip
                          label={(gap.severity || 'unknown').toUpperCase()}
                          size="small"
                          color={getSeverityColor(gap.severity) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Current Score: {gap.score}%
                        </Typography>
                        {gap.recommendation && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            📌 {gap.recommendation}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={8}>
              <LightbulbIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No learning gaps identified
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep up the good work! Complete more exams to get personalized recommendations.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage;
