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
  School as SchoolIcon,
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
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      const token = localStorage.getItem('accessToken');
      if (!attemptId || hasFetched || !token) {
        if (!attemptId) setError('No attempt ID provided');
        setLoading(false);
        return;
      }
      
      setHasFetched(true);
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
  }, [attemptId, hasFetched]);

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

  const totalQuestions = result.answers?.length || 0;
  const correctAnswers = result.answers?.filter((a: any) => a.isCorrect).length || 0;
  const wrongAnswers = result.answers?.filter((a: any) => !a.isCorrect && a.selectedAnswer).length || 0;
  const skipped = totalQuestions - correctAnswers - wrongAnswers;
  
  const pieData = [
    { name: 'Correct', value: correctAnswers },
    { name: 'Wrong', value: wrongAnswers },
    { name: 'Skipped', value: skipped },
  ];

  // Initialize optional data arrays
  const topicPerformance: Array<{ topic: string; correct: number; total: number }> =
    (result.analytics?.topicPerformance as Array<{ topic: string; correct: number; total: number }> | undefined) || [];
  const feedback = (result as any).feedback as {
    overallFeedback?: string;
    strengths?: Array<{ type: string; priority: string; message: string }>;
    weaknesses?: Array<{ type: string; priority: string; message: string }>;
    recommendations?: Array<{ type: string; priority: string; message: string }>;
    nextSteps?: string[];
  } | null;
  const strengths: string[] = (feedback?.strengths || []).map((s) => s.message);
  const improvements: string[] = (feedback?.weaknesses || []).map((w) => w.message);
  const canShowAnswers = Boolean((result as any).showAnswers);

  // Use backend's calculated timeInMinutes
  const timeAttendedMinutes = (result as any).timeInMinutes || 0;

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
          {result.examTitle || 'Exam Results'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Submitted on{' '}
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
                {result.totalScore || 0} / {result.totalMarks || 0} marks
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
                      label={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} answers`} />
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
                {timeAttendedMinutes > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                        <TrendingUpIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={`Time Attended: ${timeAttendedMinutes} minutes`} />
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

        {/* Detailed Answer Review */}
        {canShowAnswers && result.answers && result.answers.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Answer Review
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {result.answers.map((answer: any, index: number) => {
                    const options = Array.isArray(answer.options) ? answer.options : [];
                    const getOptionId = (opt: any) => opt?._id?.toString?.() || opt?.id?.toString?.() || opt?._id || opt?.id;
                    const getOptionText = (opt: any) => opt?.text || opt?.option || opt?.optionText || '';

                    const normalizeValue = (val: any) => val?.toString?.() || val;

                    const selectedValues = Array.isArray(answer.selectedAnswer)
                      ? answer.selectedAnswer
                      : (answer.selectedAnswer !== undefined && answer.selectedAnswer !== null ? [answer.selectedAnswer] : []);

                    const selectedTexts = selectedValues.map((val: any) => {
                      const match = options.find((opt: any) => normalizeValue(getOptionId(opt)) === normalizeValue(val) || normalizeValue(getOptionText(opt)) === normalizeValue(val));
                      return match ? getOptionText(match) : String(val);
                    }).filter(Boolean);

                    const correctOptionTexts = options
                      .filter((opt: any) => opt?.isCorrect)
                      .map((opt: any) => getOptionText(opt))
                      .filter(Boolean);

                    const fallbackCorrectValues = Array.isArray(answer.correctAnswer)
                      ? answer.correctAnswer
                      : (answer.correctAnswer ? [answer.correctAnswer] : []);

                    const fallbackCorrectTexts = fallbackCorrectValues.map((val: any) => {
                      const match = options.find((opt: any) => normalizeValue(getOptionId(opt)) === normalizeValue(val) || normalizeValue(getOptionText(opt)) === normalizeValue(val));
                      return match ? getOptionText(match) : String(val);
                    }).filter(Boolean);

                    const correctTexts = correctOptionTexts.length > 0 ? correctOptionTexts : fallbackCorrectTexts;
                    const hasAnswer = selectedTexts.length > 0;

                    return (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: 1,
                        backgroundColor: answer.isCorrect ? '#f0fdf4' : '#fef2f2',
                        borderLeft: `4px solid ${answer.isCorrect ? '#10b981' : '#ef4444'}`,
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: answer.isCorrect ? '#10b981' : '#ef4444',
                            color: 'white',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600} mb={1}>
                            {answer.questionText || `Question ${index + 1}`}
                          </Typography>
                          <Box ml={1}>
                            {hasAnswer ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mb: 0.5,
                                  color: answer.isCorrect ? '#10b981' : '#ef4444',
                                  fontWeight: 600,
                                }}
                              >
                                {answer.isCorrect ? '✓ ' : '✗ '}Your Answer: {selectedTexts.join(', ')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Not attempted
                              </Typography>
                            )}

                            {!answer.isCorrect && correctTexts.length > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  mb: 0.5,
                                }}
                              >
                                ✓ Correct Answer: {correctTexts.join(', ')}
                              </Typography>
                            )}

                            {answer.isCorrect && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: '#16a34a',
                                  fontWeight: 600,
                                  mb: 0.5,
                                }}
                              >
                                Great job! You got this right.
                              </Typography>
                            )}

                            {answer.explanation && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: '#6b7280',
                                  fontStyle: 'italic',
                                  mb: 0.5,
                                }}
                              >
                                Explanation: {answer.explanation}
                              </Typography>
                            )}

                            {answer.marksAwarded !== undefined && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                                Marks: {answer.marksAwarded} / {answer.maxMarks || answer.marksAwarded}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {!canShowAnswers && (
          <Grid item xs={12}>
            <Alert severity="info">
              Detailed answer review is disabled for this exam by your educator.
            </Alert>
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

        {/* Overall Feedback & Recommendations */}
        {feedback && (
          <>
            {feedback.overallFeedback && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <SchoolIcon color="primary" />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        AI Feedback Summary
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {feedback.overallFeedback}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {feedback.recommendations && feedback.recommendations.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar sx={{ bgcolor: 'info.light' }}>
                        <LightbulbIcon color="info" />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Recommendations
                      </Typography>
                    </Box>
                    <List>
                      {feedback.recommendations.map((rec, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Chip
                              label={rec.priority}
                              size="small"
                              color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                            />
                          </ListItemIcon>
                          <ListItemText primary={rec.message} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {feedback.nextSteps && feedback.nextSteps.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        <TrendingUpIcon color="secondary" />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Next Steps
                      </Typography>
                    </Box>
                    <List>
                      {feedback.nextSteps.map((step: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Chip label={index + 1} size="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={step} />
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
