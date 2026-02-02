/**
 * 🎓 Academic Intelligence Platform - Question Bank Page
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  InputAdornment,
  Skeleton,
  Alert,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  QuestionAnswer as QuestionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { examAPI } from '@/services/api';

interface Question {
  id: string | number;
  questionText: string;
  questionType: 'mcq' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  chapter?: string;
  chapterName?: string;
  concept?: string;
  conceptName?: string;
  options?: Array<{
    id: string | number;
    optionText: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  createdAt?: string;
}

const QuestionBank: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'mcq' as Question['questionType'],
    difficulty: 'medium' as Question['difficulty'],
    marks: 1,
    chapter: '',
    concept: '',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
    correctAnswer: '',
  });

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch questions from all exams
      const response = await examAPI.getExams();
      const exams = response.data.data as any[] || [];
      
      // Collect all questions from all exams
      const allQuestions: Question[] = [];
      for (const exam of exams) {
        if (exam.questions && exam.questions.length > 0) {
          allQuestions.push(...exam.questions.map((q: any) => ({
            ...q,
            examTitle: exam.title,
          })));
        }
      }
      setQuestions(allQuestions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, question: Question) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuestion(question);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    // In a real implementation, this would call the API
    // For now, just remove from local state
    if (selectedQuestion) {
      setQuestions(questions.filter(q => q.id !== selectedQuestion.id));
      setDeleteDialogOpen(false);
      setSelectedQuestion(null);
    }
  };

  const handleCreateQuestion = async () => {
    // In a real implementation, this would call the API to create the question
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      questionText: questionForm.questionText,
      questionType: questionForm.questionType,
      difficulty: questionForm.difficulty,
      marks: questionForm.marks,
      chapter: questionForm.chapter,
      concept: questionForm.concept,
      options: questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice' 
        ? questionForm.options.map((opt, idx) => ({
            id: `opt-${idx}`,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          }))
        : undefined,
      correctAnswer: questionForm.questionType !== 'mcq' && questionForm.questionType !== 'multiple_choice'
        ? questionForm.correctAnswer
        : undefined,
    };
    
    setQuestions([newQuestion, ...questions]);
    setCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'mcq',
      difficulty: 'medium',
      marks: 1,
      chapter: '',
      concept: '',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      correctAnswer: '',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'short_answer': return 'Short Answer';
      case 'essay': return 'Essay';
      default: return type;
    }
  };

  const filterQuestions = () => {
    let filtered = questions;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.concept?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tab (difficulty)
    switch (tabValue) {
      case 1: filtered = filtered.filter(q => q.difficulty === 'easy'); break;
      case 2: filtered = filtered.filter(q => q.difficulty === 'medium'); break;
      case 3: filtered = filtered.filter(q => q.difficulty === 'hard'); break;
    }
    
    return filtered;
  };

  const QuestionCard: React.FC<{ question: Question }> = ({ question }) => (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" gap={1} mb={1}>
              <Chip label={getTypeLabel(question.questionType)} size="small" variant="outlined" />
              <Chip 
                label={question.difficulty} 
                size="small" 
                color={getDifficultyColor(question.difficulty) as any}
              />
              <Chip label={`${question.marks} marks`} size="small" />
            </Box>
            <Typography variant="body1" fontWeight={500} mb={1}>
              {question.questionText}
            </Typography>
            {question.options && question.options.length > 0 && (
              <Box mt={2}>
                {question.options.map((opt, idx) => (
                  <Typography 
                    key={idx} 
                    variant="body2" 
                    color={opt.isCorrect ? 'success.main' : 'text.secondary'}
                    sx={{ mb: 0.5 }}
                  >
                    {String.fromCharCode(65 + idx)}. {opt.optionText} {opt.isCorrect && '✓'}
                  </Typography>
                ))}
              </Box>
            )}
            {(question.chapter || question.concept) && (
              <Box display="flex" gap={1} mt={2}>
                {question.chapter && (
                  <Chip label={`Chapter: ${question.chapterName || question.chapter}`} size="small" variant="outlined" />
                )}
                {question.concept && (
                  <Chip label={`Concept: ${question.conceptName || question.concept}`} size="small" variant="outlined" />
                )}
              </Box>
            )}
          </Box>
          <IconButton onClick={(e) => handleMenuOpen(e, question)}>
            <MoreIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={150} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={fetchQuestions}>
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
          <Typography variant="h4" fontWeight={700} gutterBottom>Question Bank</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your question repository ({questions.length} questions)
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setCreateDialogOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          Add Question
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search questions..."
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`All (${questions.length})`} />
              <Tab label={`Easy (${questions.filter(q => q.difficulty === 'easy').length})`} />
              <Tab label={`Medium (${questions.filter(q => q.difficulty === 'medium').length})`} />
              <Tab label={`Hard (${questions.filter(q => q.difficulty === 'hard').length})`} />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* Questions List */}
      {filterQuestions().length > 0 ? (
        filterQuestions().map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <QuestionIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchQuery ? 'Try a different search term' : 'Add questions to your bank to get started'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
              Add Question
            </Button>
          )}
        </Paper>
      )}

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { /* Edit question */ handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { /* Duplicate question */ handleMenuClose(); }}>
          <CopyIcon sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Create Question Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={questionForm.questionType}
                  label="Question Type"
                  onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value as Question['questionType'] })}
                >
                  <MenuItem value="mcq">Multiple Choice</MenuItem>
                  <MenuItem value="true_false">True/False</MenuItem>
                  <MenuItem value="short_answer">Short Answer</MenuItem>
                  <MenuItem value="essay">Essay</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={questionForm.difficulty}
                  label="Difficulty"
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as Question['difficulty'] })}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Marks"
                value={questionForm.marks}
                onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
              />
            </Grid>

            {(questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice') && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Options (check the correct answer)</Typography>
                {questionForm.options.map((option, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={2} mb={1}>
                    <Checkbox
                      checked={option.isCorrect}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index].isCorrect = e.target.checked;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={`Option ${String.fromCharCode(65 + index)}`}
                      value={option.optionText}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index].optionText = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                    />
                  </Box>
                ))}
              </Grid>
            )}

            {questionForm.questionType === 'true_false' && (
              <Grid item xs={12}>
                <FormControl>
                  <Typography variant="subtitle2" gutterBottom>Correct Answer</Typography>
                  <RadioGroup
                    row
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}

            {(questionForm.questionType === 'short_answer' || questionForm.questionType === 'essay') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expected Answer / Answer Key"
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateQuestion}
            disabled={!questionForm.questionText}
          >
            Add Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionBank;
