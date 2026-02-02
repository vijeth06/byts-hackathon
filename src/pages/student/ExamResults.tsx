/**
 * 🎓 Academic Intelligence Platform - Exam Results Page
 * Production version - fetches real results from backend API
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useExamStore } from '@/store';
import { ExamAttempt } from '@/types';

const COLORS = ['#10b981', '#ef4444', '#94a3b8'];

const ExamResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const { 
    fetchAttemptResults, 
    examsError,
    clearError 
  } = useExamStore();
  
  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!attemptId) {
        setError('No attempt ID provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await fetchAttemptResults(attemptId);
        if (data) {
          setResult(data);
        } else {
          setError('Failed to load exam results');
        }
      } catch (err) {
        setError('An error occurred while loading results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [attemptId, fetchAttemptResults]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10b981';
    if (grade.startsWith('B')) return '#6366f1';
    if (grade.startsWith('C')) return '#f59e0b';
    return '#ef4444';
  };

  // Loading state
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" height={150} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error || examsError) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/student/exams')} sx={{ mb: 2 }}>
          Back to Exams
        </Button>
        <Alert severity="error" onClose={() => { setError(null); clearError(); }}>
          {error || examsError}
        </Alert>
      </Box>
    );
  }

  // No results state
  if (!result) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/student/exams')} sx={{ mb: 2 }}>
          Back to Exams
        </Button>
        <Alert severity="warning">
          No exam results found for this attempt.
        </Alert>
      </Box>
    );
  }

  const exam = result.exam as any;
  const totalQuestions = result.answers?.length || exam?.questions?.length || 0;
  const correctAnswers = result.answers?.filter((a: any) => a.isCorrect).length || 0;
  const wrongAnswers = result.answers?.filter((a: any) => !a.isCorrect && a.selectedOptionId).length || 0;
  const skipped = totalQuestions - correctAnswers - wrongAnswers;
  
  const pieData = [
    { name: 'Correct', value: correctAnswers },
    { name: 'Wrong', value: wrongAnswers },
    { name: 'Skipped', value: skipped },
  ];

  // Calculate topic performance if available
  const topicPerformance = result.analytics?.topicPerformance || [];
  
  // Get feedback if available
  const strengths = result.feedback?.strengths || [];
  const improvements = result.feedback?.improvements || [];

  const timeTaken = result.submittedAt && result.startedAt 
    ? Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000)
    : null;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/student/exams')}>
          Back to Exams
        </Button>
      </Box>

      {/* Title Card */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {exam?.title || 'Exam Results'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {exam?.description || ''} • Submitted on{' '}
          {result.submittedAt 
            ? new Date(result.submittedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A'
          }
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Score Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: `${getGradeColor(result.grade || 'N/A')}20`,
                  color: getGradeColor(result.grade || 'N/A'),
                  fontSize: '2rem',
                  fontWeight: 700,
                }}
              >
                {result.grade || 'N/A'}
              </Avatar>
              <Typography variant="h2" fontWeight={700} color="primary">
                {Math.round(result.percentage || 0)}%
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                {result.score || 0} / {exam?.totalMarks || 0} marks
              </Typography>
              {result.passed !== undefined && (
                <Chip
                  icon={result.passed ? <CheckIcon /> : <WrongIcon />}
                  label={result.passed ? 'Passed' : 'Not Passed'}
                  color={result.passed ? 'success' : 'error'}
                  variant="outlined"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Answer Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Answer Distribution
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckIcon sx={{ color: '#10b981' }} />
                  <Typography variant="body2">{correctAnswers} Correct</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <WrongIcon sx={{ color: '#ef4444' }} />
                  <Typography variant="body2">{wrongAnswers} Wrong</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                      {totalQuestions}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary="Total Questions" />
                </ListItem>
                {timeTaken && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                        <TrendingUpIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={`Time Taken: ${timeTaken} minutes`} />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'info.light', width: 36, height: 36 }}>
                      <StarIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary={`Accuracy: ${totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Topic Performance - only show if data available */}
        {topicPerformance.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Performance by Topic
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={topicPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="correct" fill="#10b981" name="Correct" />
                      <Bar dataKey="total" fill="#e2e8f0" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Strengths & Improvements - only show if feedback available */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <>
            {strengths.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <CheckIcon color="success" />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Strengths
                      </Typography>
                    </Box>
                    <List>
                      {strengths.map((strength: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <StarIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {improvements.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar sx={{ bgcolor: 'warning.light' }}>
                        <LightbulbIcon color="warning" />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Areas for Improvement
                      </Typography>
                    </Box>
                    <List>
                      {improvements.map((improvement: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <TrendingUpIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={improvement} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </>
        )}
      </Grid>

      {/* Actions */}
      <Box display="flex" justifyContent="center" gap={2} mt={4}>
        <Button variant="outlined" onClick={() => navigate('/student/exams')}>
          Back to Exams
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/student/analytics')}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
        >
          View Full Analytics
        </Button>
      </Box>
    </Box>
  );
};

export default ExamResultsPage;
