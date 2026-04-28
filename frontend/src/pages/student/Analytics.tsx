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
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  EmojiEvents as EmojiEventsIcon,
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
  const [pageLoading, setPageLoading] = useState(true);
  const {
    studentAnalytics,
    chapterPerformance,
    conceptMastery,
    difficultyAnalysis,
    performanceTrend,
    learningGaps,
    feedback,
    isLoading,
    error,
    fetchStudentAnalytics,
    fetchChapterPerformance,
    fetchConceptMastery,
    fetchDifficultyAnalysis,
    fetchPerformanceTrend,
    fetchLearningGaps,
    fetchMyFeedback,
    clearError,
  } = useAnalyticsStore();

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !token) return;
    setHasFetched(true);

    const loadAllAnalytics = async () => {
      setPageLoading(true);
      try {
        await Promise.all([
          fetchStudentAnalytics(),
          fetchChapterPerformance(),
          fetchConceptMastery(),
          fetchDifficultyAnalysis(),
          fetchPerformanceTrend(),
          fetchLearningGaps(),
          fetchMyFeedback(),
        ]);
      } finally {
        setPageLoading(false);
      }
    };

    loadAllAnalytics();
  }, [hasFetched]);

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

  const pageIsLoading = pageLoading || isLoading;

  if (pageIsLoading) {
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
      <Box mb={{ xs: 2, md: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
          Performance Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
          Track your learning progress and identify areas for improvement
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} mb={{ xs: 2, md: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                  <SchoolIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{Math.round(overallScore)}%</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Overall Score</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Avatar sx={{ bgcolor: improvement >= 0 ? 'success.light' : 'error.light', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                  <TrendingUpIcon color={improvement >= 0 ? 'success' : 'error'} sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {improvement >= 0 ? '+' : ''}{Math.round(improvement)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Improvement</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Avatar sx={{ bgcolor: 'info.light', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                  <StarIcon color="info" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{currentGrade}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Current Grade</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Avatar sx={{ bgcolor: 'warning.light', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                  <WarningIcon color="warning" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box textAlign={{ xs: 'center', sm: 'left' }}>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{gapCount}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Learning Gaps</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: { xs: 2, md: 3 } }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 90 },
              px: { xs: 1.5, sm: 2 },
            },
          }}
        >
          <Tab label="Chapters" />
          <Tab label="Concepts" />
          <Tab label="Difficulty" />
          <Tab label="Trend" />
          <Tab label="Gaps" />
          <Tab label="AI Feedback" />
        </Tabs>
      </Paper>

      {/* Chapter Performance */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Performance by Chapter
          </Typography>
          {chapterPerformance && chapterPerformance.length > 0 ? (
            <Box sx={{ height: { xs: 280, sm: 350, md: 400 }, mx: { xs: -1, sm: 0 } }}>
              <ResponsiveContainer>
                <BarChart data={chapterPerformance} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={35} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
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
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Concept Mastery Radar
          </Typography>
          {conceptMastery && conceptMastery.length > 0 ? (
            <Box sx={{ height: { xs: 280, sm: 350, md: 400 } }}>
              <ResponsiveContainer>
                <RadarChart data={conceptMastery} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="concept" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
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
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Performance by Difficulty
          </Typography>
          {difficultyAnalysis && difficultyAnalysis.length > 0 ? (
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {difficultyAnalysis.map((item: any) => (
                <Grid item xs={12} sm={4} key={item.difficulty}>
                  <Card>
                    <CardContent sx={{ p: { xs: 2, md: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' }, textTransform: 'capitalize' }}>{item.difficulty}</Typography>
                      <Typography fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                        {Math.round(item.accuracy || 0)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        {item.correctAnswers} / {item.totalQuestions} correct
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={item.accuracy || 0}
                        sx={{ height: { xs: 6, md: 8 }, borderRadius: 4 }}
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
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Score Trend Over Time
          </Typography>
          {performanceTrend && performanceTrend.length > 0 ? (
            <Box sx={{ height: { xs: 280, sm: 350, md: 400 }, mx: { xs: -1, sm: 0 } }}>
              <ResponsiveContainer>
                <AreaChart data={performanceTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={35} />
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
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Identified Learning Gaps
          </Typography>
          {learningGaps && learningGaps.length > 0 ? (
            <List sx={{ p: 0 }}>
              {learningGaps.map((gap: any, index: number) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: { xs: 1.5, md: 2 },
                    p: { xs: 1.5, md: 2 },
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 'auto', sm: 56 }, mb: { xs: 1, sm: 0 } }}>
                    <Avatar sx={{ bgcolor: `${getSeverityColor(gap.severity)}.light`, width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                      <LightbulbIcon color={getSeverityColor(gap.severity) as any} sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    sx={{ m: 0 }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          {gap.conceptName || gap.chapterName || gap.topic || 'Unknown'}
                        </Typography>
                        <Chip
                          label={(gap.severity || 'unknown').toUpperCase()}
                          size="small"
                          color={getSeverityColor(gap.severity) as any}
                          sx={{ height: { xs: 20, sm: 24 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Current Score: {gap.currentAccuracy ?? gap.score ?? 0}%
                        </Typography>
                        {gap.recommendation && (
                          <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
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

      {/* AI Feedback */}
      <TabPanel value={tabValue} index={5}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            AI-Powered Personalized Feedback
          </Typography>
          {feedback ? (
            <Box>
              {/* Summary */}
              {feedback.summary && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body1">{feedback.summary}</Typography>
                </Alert>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={600} color="success.main" gutterBottom>
                    <CheckCircleIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Strengths
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {feedback.strengths.map((item: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 1, px: 1.5, bgcolor: 'rgba(16, 185, 129, 0.08)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" fontWeight={600} color="text.primary">{item.title}</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Areas for Improvement */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={600} color="warning.main" gutterBottom>
                    <ArrowUpwardIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Areas for Improvement
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {feedback.improvements.map((item: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 1, px: 1.5, bgcolor: 'rgba(245, 158, 11, 0.08)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" fontWeight={600} color="text.primary">{item.title}</Typography>}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                              {item.actionItems && item.actionItems.length > 0 && (
                                <Box mt={0.5}>
                                  {item.actionItems.map((action: string, ai: number) => (
                                    <Chip key={ai} label={action} size="small" variant="outlined" sx={{ mr: 0.5, mt: 0.5, fontSize: '0.7rem' }} />
                                  ))}
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Recommendations */}
              {feedback.recommendations && feedback.recommendations.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                    <LightbulbIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Recommendations
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {feedback.recommendations.map((item: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 1, px: 1.5, bgcolor: 'rgba(37, 99, 235, 0.08)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'rgba(37, 99, 235, 0.2)' }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" fontWeight={600} color="text.primary">{item.title}</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Achievements */}
              {feedback.achievements && feedback.achievements.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={600} color="secondary" gutterBottom>
                    <EmojiEventsIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Achievements
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {feedback.achievements.map((item: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 1, px: 1.5, bgcolor: 'rgba(124, 58, 237, 0.08)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" fontWeight={600} color="text.primary">{item.title}</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Warnings */}
              {feedback.warnings && feedback.warnings.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight={600} color="error" gutterBottom>
                    <WarningIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Warnings
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {feedback.warnings.map((item: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 1, px: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" fontWeight={600} color="text.primary">{item.title}</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <FeedbackIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No feedback available yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete exams to receive AI-powered personalized feedback on your performance.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage;
