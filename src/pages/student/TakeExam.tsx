/**
 * 🎓 Academic Intelligence Platform - Take Exam Page
 * Production version - fetches real exam data from backend API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Grid,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Flag as FlagIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamStore } from '@/store';

interface Answer {
  questionId: string | number;
  selectedOptionId?: string;
  textAnswer?: string;
  isMarkedForReview: boolean;
}

const TakeExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { 
    currentExam, 
    currentAttempt,
    isLoadingExams, 
    examsError,
    fetchExamById,
    saveAnswer,
    submitExam,
    clearError,
  } = useExamStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string | number, Answer>>(new Map());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch exam data
  useEffect(() => {
    if (examId) {
      fetchExamById(examId);
    }
  }, [examId, fetchExamById]);

  // Set initial timer based on exam duration
  useEffect(() => {
    if (currentExam?.durationMinutes) {
      // If there's an ongoing attempt, calculate remaining time
      if (currentAttempt?.startedAt) {
        const startTime = new Date(currentAttempt.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = (currentExam.durationMinutes * 60) - elapsed;
        setTimeLeft(Math.max(0, remaining));
      } else {
        setTimeLeft(currentExam.durationMinutes * 60);
      }
    }
  }, [currentExam, currentAttempt]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = currentExam?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = useCallback(async (questionId: string | number, value: string) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(questionId) || { questionId, isMarkedForReview: false };
      
      // Determine if it's an option selection or text answer
      if (currentQuestion?.questionType === 'short_answer' || currentQuestion?.questionType === 'essay') {
        newAnswers.set(questionId, { ...existing, textAnswer: value });
      } else {
        newAnswers.set(questionId, { ...existing, selectedOptionId: value });
      }
      
      return newAnswers;
    });

    // Save answer to backend
    if (currentAttempt?.id) {
      const isTextAnswer = currentQuestion?.questionType === 'short_answer' || currentQuestion?.questionType === 'essay';
      await saveAnswer(String(currentAttempt.id), String(questionId), isTextAnswer ? undefined : value, isTextAnswer ? value : undefined);
    }
  }, [currentQuestion, currentAttempt, saveAnswer]);

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const qId = currentQuestion.id;
      const existing = newAnswers.get(qId) || { questionId: qId, isMarkedForReview: false };
      newAnswers.set(qId, { ...existing, isMarkedForReview: !existing.isMarkedForReview });
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (!currentAttempt?.id) return;
    
    setIsSubmitting(true);
    const success = await submitExam(String(currentAttempt.id));
    setIsSubmitting(false);
    
    if (success) {
      navigate(`/student/results/${currentAttempt.id}`);
    }
    setSubmitDialogOpen(false);
  };

  const getQuestionStatus = (qId: string | number) => {
    const answer = answers.get(qId);
    if (!answer) return 'unanswered';
    if (answer.isMarkedForReview) return 'flagged';
    if (answer.selectedOptionId || answer.textAnswer) return 'answered';
    return 'unanswered';
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    
    const qId = currentQuestion.id;
    const answer = answers.get(qId);

    switch (currentQuestion.questionType) {
      case 'mcq':
      case 'multiple_choice':
      case 'true_false':
        return (
          <RadioGroup
            value={answer?.selectedOptionId || ''}
            onChange={(e) => handleAnswerChange(String(qId), e.target.value)}
          >
            {currentQuestion.options?.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.text || option.optionText}
                sx={{
                  mb: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: answer?.selectedOptionId === option.id ? 'primary.50' : 'transparent',
                  border: '1px solid',
                  borderColor: answer?.selectedOptionId === option.id ? 'primary.main' : 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              />
            ))}
          </RadioGroup>
        );

      case 'short_answer':
      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={currentQuestion.questionType === 'essay' ? 8 : 4}
            placeholder="Type your answer here..."
            value={answer?.textAnswer || ''}
            onChange={(e) => handleAnswerChange(String(qId), e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoadingExams) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3, mt: 8 }}>
        <Box sx={{ px: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  // Error state
  if (examsError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3, mt: 8 }}>
        <Box sx={{ px: 3 }}>
          <Alert severity="error" onClose={clearError}>
            {examsError}
          </Alert>
          <Button onClick={() => navigate('/student/exams')} sx={{ mt: 2 }}>
            Back to Exams
          </Button>
        </Box>
      </Box>
    );
  }

  // No exam found
  if (!currentExam || questions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3, mt: 8 }}>
        <Box sx={{ px: 3 }}>
          <Alert severity="warning">
            No exam data found. The exam may have expired or been removed.
          </Alert>
          <Button onClick={() => navigate('/student/exams')} sx={{ mt: 2 }}>
            Back to Exams
          </Button>
        </Box>
      </Box>
    );
  }

  const progress = (answers.size / questions.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      {/* Timer Header */}
      <Paper
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {currentExam.title}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={<TimerIcon />}
            label={formatTime(timeLeft)}
            color={timeLeft < 300 ? 'error' : 'primary'}
            sx={{ fontWeight: 600 }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit Exam
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: 10, px: 3 }}>
        <Grid container spacing={3}>
          {/* Question Panel */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {/* Progress */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {answers.size}/{questions.length} answered
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>

              {/* Question */}
              {currentQuestion && (
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Question {currentIndex + 1} of {questions.length}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={`${currentQuestion.marks} marks`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Tooltip title="Mark for review">
                        <IconButton
                          onClick={toggleMarkForReview}
                          color={answers.get(currentQuestion.id)?.isMarkedForReview ? 'warning' : 'default'}
                        >
                          <FlagIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="body1" mb={3}>
                    {currentQuestion.questionText || currentQuestion.text}
                  </Typography>

                  {renderQuestionContent()}
                </Box>
              )}

              {/* Navigation */}
              <Box display="flex" justifyContent="space-between">
                <Button
                  startIcon={<PrevIcon />}
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  endIcon={<NextIcon />}
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Question Navigator */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Question Navigator
              </Typography>
              <Grid container spacing={1}>
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q.id);
                  return (
                    <Grid item key={q.id}>
                      <Button
                        variant={currentIndex === index ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setCurrentIndex(index)}
                        sx={{
                          minWidth: 40,
                          bgcolor:
                            status === 'answered'
                              ? 'success.light'
                              : status === 'flagged'
                              ? 'warning.light'
                              : undefined,
                        }}
                      >
                        {index + 1}
                        {status === 'flagged' && <FlagIcon sx={{ fontSize: 12, ml: 0.5 }} />}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Legend */}
              <Box mt={3}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Legend:
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 1 }} />
                    <Typography variant="caption">Answered</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 1 }} />
                    <Typography variant="caption">Flagged</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 16, height: 16, border: '1px solid', borderColor: 'divider', borderRadius: 1 }} />
                    <Typography variant="caption">Unanswered</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit your exam?
          </Typography>
          <Box mt={2}>
            <Typography variant="body2">
              Answered: {answers.size} / {questions.length}
            </Typography>
            <Typography variant="body2">
              Flagged: {Array.from(answers.values()).filter((a) => a.isMarkedForReview).length}
            </Typography>
            <Typography variant="body2">
              Unanswered: {questions.length - answers.size}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Continue Exam</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? undefined : <CheckIcon />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeExamPage;
