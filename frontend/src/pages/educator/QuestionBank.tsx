/**
 * 🎓 Academic Intelligence Platform - Question Bank Page
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  QuestionAnswer as QuestionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { questionAPI, subjectAPI, chapterAPI } from '@/services/api';

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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [newConceptName, setNewConceptName] = useState('');
  const [isCreatingConcept, setIsCreatingConcept] = useState(false);
  const chapterCacheRef = useRef<Record<string, any[]>>({});
  const conceptCacheRef = useRef<Record<string, any[]>>({});

  const dedupeSubjects = (items: any[] = []) => {
    return Array.from(new Map(items.filter((item) => item?.id).map((item) => [item.id, item])).values());
  };

  const dedupeChapters = (items: any[] = []) => {
    return Array.from(
      new Map(
        items
          .filter((item) => item?.id)
          .map((item) => [
            `${String(item.chapterNumber ?? '').trim()}::${String(item.name ?? '').trim().toLowerCase()}`,
            item,
          ])
      ).values()
    );
  };

  const dedupeConcepts = (items: any[] = []) => {
    return Array.from(
      new Map(
        items
          .filter((item) => item?.id)
          .map((item) => [String(item.name ?? '').trim().toLowerCase(), item])
      ).values()
    );
  };

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'mcq' as Question['questionType'],
    difficulty: 'medium' as Question['difficulty'],
    marks: 1,
    subjectId: '',
    chapterId: '',
    conceptId: '',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
    correctAnswer: '',
  });

  const [hasFetched, setHasFetched] = useState(false);

  // Fetch questions and subjects on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !token) return;
    setHasFetched(true);
    fetchQuestions();
    fetchSubjects();
  }, [hasFetched]);

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getSubjects({ limit: 500, simple: true });
      const data = response.data.data as { subjects?: any[] } | any[];
      const subjectsList = Array.isArray(data) ? data : (data?.subjects || []);
      setSubjects(dedupeSubjects(subjectsList));
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const loadChaptersForSubject = async (subjectId: string) => {
    if (!subjectId) {
      setChapters([]);
      return;
    }

    if (chapterCacheRef.current[subjectId]) {
      setChapters(chapterCacheRef.current[subjectId]);
      return;
    }

    try {
      const response = await subjectAPI.getChaptersBySubject(subjectId, { limit: 500, simple: true });
      const data = response.data.data as { chapters?: any[] } | any[];
      const chaptersList = Array.isArray(data) ? data : (data?.chapters || []);
      const uniqueChapters = dedupeChapters(chaptersList);
      chapterCacheRef.current[subjectId] = uniqueChapters;
      setChapters(uniqueChapters);
    } catch (err: any) {
      console.error('Failed to fetch chapters:', err);
      setChapters([]);
    }
  };

  const loadConceptsForChapter = async (chapterId: string) => {
    if (!chapterId) {
      setConcepts([]);
      return;
    }

    if (conceptCacheRef.current[chapterId]) {
      setConcepts(conceptCacheRef.current[chapterId]);
      return;
    }

    try {
      const response = await chapterAPI.getConceptsByChapter(chapterId, { limit: 500, simple: true });
      const data = response.data.data as { concepts?: any[] } | any[];
      const conceptsList = Array.isArray(data) ? data : (data?.concepts || []);
      const uniqueConcepts = dedupeConcepts(conceptsList);
      conceptCacheRef.current[chapterId] = uniqueConcepts;
      setConcepts(uniqueConcepts);
    } catch (err: any) {
      console.error('Failed to fetch concepts:', err);
      setConcepts([]);
    }
  };

  const handleSubjectChange = async (subjectId: string) => {
    setQuestionForm((prev) => ({ ...prev, subjectId, chapterId: '', conceptId: '' }));
    setChapters([]);
    setConcepts([]);
    setNewConceptName('');
    await loadChaptersForSubject(subjectId);
  };

  const handleChapterChange = async (chapterId: string) => {
    setQuestionForm((prev) => ({ ...prev, chapterId, conceptId: '' }));
    setConcepts([]);
    setNewConceptName('');
    await loadConceptsForChapter(chapterId);
  };

  const handleCreateConceptInline = async () => {
    if (!questionForm.chapterId || !newConceptName.trim()) {
      return;
    }

    setIsCreatingConcept(true);
    try {
      const response = await chapterAPI.createConcept(questionForm.chapterId, {
        name: newConceptName.trim(),
        difficultyLevel: 'medium',
      });
      const data = response.data.data as { id?: string; concept?: any } | any;
      const createdConcept = data?.concept || data;

      delete conceptCacheRef.current[questionForm.chapterId];
      await handleChapterChange(questionForm.chapterId);
      if (createdConcept?.id) {
        setQuestionForm((prev) => ({ ...prev, conceptId: createdConcept.id }));
      }
      setNewConceptName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create concept');
    } finally {
      setIsCreatingConcept(false);
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch questions from question bank API
      const response = await questionAPI.getQuestions({ limit: 100 });
      const data = response.data.data as { questions?: Question[] } | Question[];
      const questionsList = Array.isArray(data) ? data : (data?.questions || []);
      setQuestions(questionsList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  };

  const mapQuestionToForm = (question: Question) => {
    const currentOptions = Array.isArray(question.options) ? question.options : [];
    const normalizedOptions = currentOptions.map((opt) => ({
      optionText: String((opt as any).optionText ?? (opt as any).text ?? ''),
      isCorrect: !!opt.isCorrect,
    }));

    while (normalizedOptions.length < 4) {
      normalizedOptions.push({ optionText: '', isCorrect: false });
    }

    const getFieldId = (value: any) => {
      if (!value) return '';
      if (typeof value === 'string' || typeof value === 'number') return String(value);
      if (typeof value === 'object' && value.id) return String(value.id);
      return '';
    };

    const resolvedCorrectAnswer =
      question.questionType === 'true_false' && !question.correctAnswer
        ? (() => {
            const trueOption = normalizedOptions.find((opt) => opt.optionText.trim().toLowerCase() === 'true');
            const falseOption = normalizedOptions.find((opt) => opt.optionText.trim().toLowerCase() === 'false');
            if (trueOption?.isCorrect) return 'true';
            if (falseOption?.isCorrect) return 'false';
            return '';
          })()
        : String(question.correctAnswer || '');

    return {
      questionText: question.questionText || '',
      questionType: (question.questionType || 'mcq') as Question['questionType'],
      difficulty: (question.difficulty || 'medium') as Question['difficulty'],
      marks: Number(question.marks || 1),
      subjectId: getFieldId((question as any).subjectId ?? (question as any).subject),
      chapterId: getFieldId((question as any).chapterId ?? (question as any).chapter),
      conceptId: getFieldId((question as any).conceptId ?? (question as any).concept),
      options: normalizedOptions,
      correctAnswer: resolvedCorrectAnswer,
    };
  };

  const handleEditQuestion = async (question: Question) => {
    setSelectedQuestion(question);
    setIsEditMode(true);
    const formState = mapQuestionToForm(question);
    setQuestionForm(formState);

    // Ensure chapter/concept dropdowns are loaded for selected subject/chapter without mutating form state.
    if (formState.subjectId) {
      await loadChaptersForSubject(formState.subjectId);
    }
    if (formState.chapterId) {
      await loadConceptsForChapter(formState.chapterId);
    }

    setCreateDialogOpen(true);
  };

  const handleDuplicateQuestion = async (question: Question) => {
    try {
      const currentOptions = Array.isArray(question.options) ? question.options : [];
      const payload = {
        questionText: `${question.questionText} (Copy)`,
        questionType: question.questionType,
        difficulty: question.difficulty,
        marks: Number(question.marks || 1),
        subjectId: (question as any).subjectId,
        chapterId: (question as any).chapterId,
        conceptId: (question as any).conceptId,
        options:
          question.questionType === 'mcq' || question.questionType === 'multiple_choice'
            ? currentOptions.map((opt: any) => ({
                text: String(opt.optionText ?? opt.text ?? ''),
                isCorrect: !!opt.isCorrect,
              }))
            : undefined,
        correctAnswer:
          question.questionType !== 'mcq' && question.questionType !== 'multiple_choice'
            ? question.correctAnswer
            : undefined,
      };

      const response = await questionAPI.createQuestion(payload as any);
      const duplicated = response.data.data as Question;
      setQuestions((prev) => [duplicated, ...prev]);
      setSnackbar({ open: true, message: 'Question duplicated successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to duplicate question',
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    
    try {
      await questionAPI.deleteQuestion(String(selectedQuestion.id));
      setQuestions(questions.filter(q => q.id !== selectedQuestion.id));
      setDeleteDialogOpen(false);
      setSelectedQuestion(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleCreateQuestion = async () => {
    try {
      if (!questionForm.subjectId || !questionForm.chapterId || !questionForm.conceptId) {
        setError('Subject, chapter, and concept are mandatory for student performance tracking');
        return;
      }

      const isChoiceQuestion = questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice';
      const isTrueFalseQuestion = questionForm.questionType === 'true_false';

      const trueFalseOptions = [
        { text: 'True', isCorrect: questionForm.correctAnswer === 'true' },
        { text: 'False', isCorrect: questionForm.correctAnswer === 'false' },
      ];

      const data = {
        questionText: questionForm.questionText,
        questionType: questionForm.questionType,
        difficulty: questionForm.difficulty,
        marks: questionForm.marks,
        subjectId: questionForm.subjectId,
        chapterId: questionForm.chapterId,
        conceptId: questionForm.conceptId,
        options: isChoiceQuestion
          ? questionForm.options.filter(opt => opt.optionText).map(opt => ({
              text: opt.optionText,
              isCorrect: opt.isCorrect,
            }))
          : isTrueFalseQuestion
            ? trueFalseOptions
            : undefined,
        correctAnswer: !isChoiceQuestion
          ? questionForm.correctAnswer
          : undefined,
      };

      if (isEditMode && selectedQuestion) {
        const response = await questionAPI.updateQuestion(String(selectedQuestion.id), data as any);
        const updatedQuestion = response.data.data as Question;
        setQuestions((prev) => prev.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q)));
        setSnackbar({ open: true, message: 'Question updated successfully', severity: 'success' });
      } else {
        const response = await questionAPI.createQuestion(data);
        const newQuestion = response.data.data as Question;
        setQuestions((prev) => [newQuestion, ...prev]);
        setSnackbar({ open: true, message: 'Question created successfully', severity: 'success' });
      }

      setCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create question');
    }
  };

  const resetForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'mcq',
      difficulty: 'medium',
      marks: 1,
      subjectId: '',
      chapterId: '',
      conceptId: '',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      correctAnswer: '',
    });
    setChapters([]);
    setConcepts([]);
    setNewConceptName('');
    setIsEditMode(false);
    setSelectedQuestion(null);
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
          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleEditQuestion(question)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate">
              <IconButton onClick={() => handleDuplicateQuestion(question)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => {
                  setSelectedQuestion(question);
                  setDeleteDialogOpen(true);
                }}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchQuestions}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setCreateDialogOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            Add Question
          </Button>
        </Box>
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

      {/* Create Question Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditMode ? 'Edit Question' : 'Add New Question'}</DialogTitle>
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
                error={questionForm.questionText.length > 0 && questionForm.questionText.length < 5}
                helperText={questionForm.questionText.length > 0 && questionForm.questionText.length < 5 ? 'Minimum 5 characters' : ''}
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
                error={questionForm.marks <= 0}
                helperText={questionForm.marks <= 0 ? 'Marks must be greater than 0' : ''}
                inputProps={{ step: '0.01', min: '0.01' }}
              />
            </Grid>

            {/* Subject/Chapter/Concept Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={questionForm.subjectId}
                  label="Subject"
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required disabled={!questionForm.subjectId}>
                <InputLabel>Chapter</InputLabel>
                <Select
                  value={questionForm.chapterId}
                  label="Chapter"
                  onChange={(e) => handleChapterChange(e.target.value)}
                >
                  {chapters.map((chapter) => (
                    <MenuItem key={chapter.id} value={chapter.id}>
                      Ch {chapter.chapterNumber}: {chapter.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required disabled={!questionForm.chapterId}>
                <InputLabel>Concept</InputLabel>
                <Select
                  value={questionForm.conceptId}
                  label="Concept"
                  onChange={(e) => setQuestionForm({ ...questionForm, conceptId: e.target.value })}
                >
                  {concepts.map((concept) => (
                    <MenuItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  label="Create Concept (if not listed)"
                  value={newConceptName}
                  onChange={(e) => setNewConceptName(e.target.value)}
                  disabled={!questionForm.chapterId || isCreatingConcept}
                  placeholder="Enter new concept name"
                />
                <Button
                  variant="outlined"
                  onClick={handleCreateConceptInline}
                  disabled={!questionForm.chapterId || !newConceptName.trim() || isCreatingConcept}
                >
                  {isCreatingConcept ? 'Creating...' : 'Create Concept'}
                </Button>
              </Box>
            </Grid>

            {(questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice') && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Options (check the correct answer)
                  {questionForm.options.filter(opt => opt.optionText).length < 2 && (
                    <Typography component="span" color="error" ml={1}>
                      (need at least 2 options)
                    </Typography>
                  )}
                  {!questionForm.options.some(opt => opt.isCorrect) && (
                    <Typography component="span" color="error" ml={1}>
                      (mark at least one as correct)
                    </Typography>
                  )}
                </Typography>
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
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateQuestion}
            disabled={questionForm.questionText.length < 5 || !questionForm.marks || !questionForm.subjectId || !questionForm.chapterId || !questionForm.conceptId || (
              (questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice') &&
              questionForm.options.filter(opt => opt.optionText).length < 2
            ) || (
              (questionForm.questionType === 'mcq' || questionForm.questionType === 'multiple_choice') &&
              !questionForm.options.some(opt => opt.isCorrect)
            )}
          >
            {isEditMode ? 'Save Changes' : 'Add Question'}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestionBank;
