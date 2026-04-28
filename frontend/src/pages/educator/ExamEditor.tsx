/**
 * 🎓 Academic Intelligence Platform - Exam Editor Page
 * Complete exam creation and editing with questions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Skeleton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  QuestionAnswer as QuestionIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { examAPI, questionAPI, authAPI, subjectAPI, chapterAPI } from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box pt={3}>{children}</Box>}</div>
);

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
}

// Section and Department interfaces for future assignment functionality
// interface Section { _id: string; name: string; year: number; semester: number; }
// interface Department { _id: string; name: string; code: string; }

const ExamEditor: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const isEditing = Boolean(examId);

  // Suppress MUI popover warnings
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('anchorEl') || args[0]?.includes?.('aria-hidden')) {
        return;
      }
      originalWarn(...args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);

  // Exam form state
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    instructions: '',
    examType: 'quiz',
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 40,
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResult: true,
    showAnswers: false,
    negativeMarking: false,
    negativeMarkValue: 0,
    startTime: null as Date | null,
    endTime: null as Date | null,
    assignmentMode: 'section' as 'section' | 'department' | 'individual' | 'all',
    assignedSections: [] as string[],
    assignedDepartments: [] as string[],
  });

  // Questions state
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [createQuestionDialogOpen, setCreateQuestionDialogOpen] = useState(false);

  // Sections and Departments for assignment
  interface SectionData {
    _id: string;
    name: string;
    year: number;
    displayName: string;
    departmentCode?: string;
    currentStrength?: number;
  }
  interface DepartmentData {
    _id?: string;
    id?: string;
    name: string;
    code: string;
  }
  const [availableSections, setAvailableSections] = useState<SectionData[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<DepartmentData[]>([]);

  // Chapter/Concept state
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
    // Deduplicate by visible chapter identity to prevent repeated labels in dropdown.
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

  // Question form
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'mcq',
    difficulty: 'medium',
    marks: 1,
    negativeMarks: 0,
    subjectId: '',
    chapterId: '',
    conceptId: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    correctAnswer: '',
    explanation: '',
  });

  // Fetch exam data if editing
  useEffect(() => {
    if (examId && examId.length > 0) {
      fetchExam();
    }
    fetchQuestionBank();
    fetchSectionsAndDepartments();
    fetchSubjects();
  }, [examId]);

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

  const handleSubjectChange = async (subjectId: string) => {
    setQuestionForm({ ...questionForm, subjectId, chapterId: '', conceptId: '' });
    setChapters([]);
    setConcepts([]);
    setNewConceptName('');

    if (subjectId && chapterCacheRef.current[subjectId]) {
      setChapters(chapterCacheRef.current[subjectId]);
      return;
    }

    if (subjectId) {
      try {
        const response = await subjectAPI.getChaptersBySubject(subjectId, { limit: 500, simple: true });
        const data = response.data.data as { chapters?: any[] } | any[];
        const chaptersList = Array.isArray(data) ? data : (data?.chapters || []);
        const uniqueChapters = dedupeChapters(chaptersList);
        chapterCacheRef.current[subjectId] = uniqueChapters;
        setChapters(uniqueChapters);
      } catch (err: any) {
        console.error('Failed to fetch chapters:', err);
      }
    }
  };

  const handleChapterChange = async (chapterId: string) => {
    setQuestionForm({ ...questionForm, chapterId, conceptId: '' });
    setConcepts([]);
    setNewConceptName('');

    if (chapterId && conceptCacheRef.current[chapterId]) {
      setConcepts(conceptCacheRef.current[chapterId]);
      return;
    }

    if (chapterId) {
      try {
        const response = await chapterAPI.getConceptsByChapter(chapterId, { limit: 500, simple: true });
        const data = response.data.data as { concepts?: any[] } | any[];
        const conceptsList = Array.isArray(data) ? data : (data?.concepts || []);
        const uniqueConcepts = dedupeConcepts(conceptsList);
        conceptCacheRef.current[chapterId] = uniqueConcepts;
        setConcepts(uniqueConcepts);
      } catch (err: any) {
        console.error('Failed to fetch concepts:', err);
      }
    }
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
      setSuccess('Concept created and selected successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create concept');
    } finally {
      setIsCreatingConcept(false);
    }
  };

  // Fetch sections and departments for assignment
  const fetchSectionsAndDepartments = async () => {
    try {
      const [sectionsRes, departmentsRes] = await Promise.all([
        authAPI.getSections(),
        authAPI.getDepartments(),
      ]);
      setAvailableSections((sectionsRes.data.data as SectionData[]) || []);
      setAvailableDepartments((departmentsRes.data.data as DepartmentData[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch sections/departments:', err);
      setError(err.response?.data?.message || 'Failed to load sections and departments');
    }
  };

  interface ExamData {
    title?: string;
    description?: string;
    instructions?: string;
    examType?: string;
    durationMinutes?: number;
    totalMarks?: number;
    passingMarks?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResult?: boolean;
    showAnswers?: boolean;
    negativeMarking?: boolean;
    negativeMarkValue?: number;
    startTime?: string;
    endTime?: string;
    assignmentMode?: 'section' | 'department' | 'individual' | 'all';
    assignedSections?: string[];
    assignedDepartments?: string[];
  }

  const fetchExam = async () => {
    setIsLoading(true);
    try {
      const response = await examAPI.getExam(examId!);
      const exam = response.data.data as ExamData;
      setExamForm({
        title: exam.title || '',
        description: exam.description || '',
        instructions: exam.instructions || '',
        examType: exam.examType || 'quiz',
        durationMinutes: exam.durationMinutes || 60,
        totalMarks: exam.totalMarks || 100,
        passingMarks: exam.passingMarks || 40,
        maxAttempts: exam.maxAttempts || 1,
        shuffleQuestions: exam.shuffleQuestions ?? true,
        shuffleOptions: exam.shuffleOptions ?? true,
        showResult: exam.showResult ?? true,
        showAnswers: exam.showAnswers ?? false,
        negativeMarking: exam.negativeMarking ?? false,
        negativeMarkValue: exam.negativeMarkValue || 0,
        startTime: exam.startTime ? new Date(exam.startTime) : null,
        endTime: exam.endTime ? new Date(exam.endTime) : null,
        assignmentMode: exam.assignmentMode || 'section',
        assignedSections: exam.assignedSections || [],
        assignedDepartments: exam.assignedDepartments || [],
      });

      // Fetch exam questions
      const questionsResponse = await examAPI.getExamQuestions(examId!);
      const questions = questionsResponse.data.data as Question[] || [];
      setExamQuestions(questions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exam');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestionBank = async () => {
    setIsLoadingBank(true);
    try {
      const response = await questionAPI.getQuestions({ limit: 100 });
      const data = response.data.data as { questions?: Question[] } | Question[];
      const questions = Array.isArray(data) ? data : (data?.questions || []);
      setAvailableQuestions(questions as Question[]);
      if (questions.length === 0) {
        console.warn('No questions available in question bank');
      }
    } catch (err: any) {
      console.error('Failed to fetch question bank:', err);
      setError(err.response?.data?.message || 'Failed to load questions from bank');
    } finally {
      setIsLoadingBank(false);
    }
  };  const handleSave = async () => {
    // Guard against rapid double-clicks before React state disables the button.
    if (saveInFlightRef.current || isSaving) {
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setError(null);
    try {
      if (isEditing) {
        // Validate examId for updates
        if (!examId || examId.length === 0) {
          setError('Invalid exam ID');
          saveInFlightRef.current = false;
          setIsSaving(false);
          return;
        }
        // For updates, only send fields allowed by backend validation
        const updateData = {
          title: examForm.title,
          description: examForm.description,
          instructions: examForm.instructions,
          examType: examForm.examType,
          durationMinutes: examForm.durationMinutes,
          totalMarks: examForm.totalMarks,
          passingMarks: examForm.passingMarks,
          negativeMarking: examForm.negativeMarking,
          negativeMarkValue: examForm.negativeMarkValue,
          shuffleQuestions: examForm.shuffleQuestions,
          shuffleOptions: examForm.shuffleOptions,
          showResult: examForm.showResult,
          showAnswers: examForm.showAnswers,
          maxAttempts: examForm.maxAttempts,
          startTime: examForm.startTime?.toISOString(),
          endTime: examForm.endTime?.toISOString(),
        };
        await examAPI.updateExam(examId, updateData);
        setSuccess('Exam updated successfully');
      } else {
        // For creation, send all fields
        const data = {
          ...examForm,
          startTime: examForm.startTime?.toISOString(),
          endTime: examForm.endTime?.toISOString(),
        };
        const response = await examAPI.createExam(data);
        const newExam = response.data.data as { id: string };
        setSuccess('Exam created successfully');
        navigate(`/educator/exams/${newExam.id}/edit`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!examId || examId.length === 0) {
      setError('Invalid exam ID');
      return;
    }

    const now = new Date();
    if (examForm.endTime && examForm.endTime <= now) {
      setError('End time must be in the future before publishing');
      setTabValue(0);
      return;
    }

    if (examForm.startTime && examForm.endTime && examForm.startTime >= examForm.endTime) {
      setError('Start time must be before end time');
      setTabValue(0);
      return;
    }

    // Client-side validation for assignments
    const hasAssignments = 
      examForm.assignmentMode === 'all' ||
      examForm.assignedSections.length > 0 ||
      examForm.assignedDepartments.length > 0;

    if (!hasAssignments) {
      setError('Cannot publish exam without assignments. Please go to Assignment tab and select sections, departments, or change assignment mode to "All Students"');
      setTabValue(2); // Switch to Assignment tab
      return;
    }

    setIsSaving(true);
    try {
      // Persist latest editor values (especially schedule) before publishing.
      const updateData = {
        title: examForm.title,
        description: examForm.description,
        instructions: examForm.instructions,
        examType: examForm.examType,
        durationMinutes: examForm.durationMinutes,
        totalMarks: examForm.totalMarks,
        passingMarks: examForm.passingMarks,
        negativeMarking: examForm.negativeMarking,
        negativeMarkValue: examForm.negativeMarkValue,
        shuffleQuestions: examForm.shuffleQuestions,
        shuffleOptions: examForm.shuffleOptions,
        showResult: examForm.showResult,
        showAnswers: examForm.showAnswers,
        maxAttempts: examForm.maxAttempts,
        startTime: examForm.startTime?.toISOString(),
        endTime: examForm.endTime?.toISOString(),
      };

      await examAPI.updateExam(examId, updateData);
      await examAPI.publishExam(examId);
      setSuccess('Exam published successfully');
      navigate('/educator/exams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish exam');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestions = async (questionIds: string[]) => {
    if (!examId || examId.length === 0) {
      setError('Invalid exam ID');
      return;
    }
    try {
      await examAPI.addQuestionsToExam(examId, questionIds);
      await fetchExam();
      setQuestionDialogOpen(false);
      setSuccess('Questions added successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add questions';
      console.error('Error adding questions:', errorMsg, err.response?.data);
      setError(errorMsg);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!examId || examId.length === 0) {
      setError('Invalid exam ID');
      return;
    }
    try {
      await examAPI.removeQuestionsFromExam(examId, [questionId]);
      setExamQuestions(examQuestions.filter(q => q.id !== questionId));
      setSuccess('Question removed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove question');
    }
  };

  const handleSaveAssignment = async () => {
    if (!examId || examId.length === 0) {
      setError('Invalid exam ID');
      return;
    }
    setIsSaving(true);
    try {
      const assignmentData = {
        sectionIds: examForm.assignedSections,
        departmentIds: examForm.assignedDepartments,
        studentIds: [],
        assignmentMode: examForm.assignmentMode,
      };
      await examAPI.assignExam(examId, assignmentData);
      setSuccess('Assignment saved successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      if (!questionForm.subjectId || !questionForm.chapterId || !questionForm.conceptId) {
        setError('Subject, chapter, and concept are mandatory for question tracking');
        return;
      }

      if (!questionForm.questionText || questionForm.questionText.trim().length < 5) {
        setError('Question text must be at least 5 characters');
        return;
      }

      if (!questionForm.marks || Number(questionForm.marks) <= 0) {
        setError('Marks must be greater than 0');
        return;
      }

      if (questionForm.questionType === 'mcq') {
        const validOptions = questionForm.options.filter((o) => o.text && o.text.trim());
        if (validOptions.length < 2) {
          setError('MCQ must have at least 2 options');
          return;
        }
        if (!questionForm.options.some((o) => o.isCorrect)) {
          setError('MCQ must have one correct option selected');
          return;
        }
      }

      if (['true_false', 'short_answer'].includes(questionForm.questionType) && !questionForm.correctAnswer) {
        setError('Please provide the correct answer for this question type');
        return;
      }

      const data = {
        questionText: questionForm.questionText,
        questionType: questionForm.questionType,
        difficulty: questionForm.difficulty,
        marks: questionForm.marks,
        negativeMarks: questionForm.negativeMarks,
        subjectId: questionForm.subjectId,
        chapterId: questionForm.chapterId,
        conceptId: questionForm.conceptId,
        options: questionForm.questionType === 'mcq'
          ? questionForm.options.filter(o => o.text).map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            }))
          : undefined,
        correctAnswer: questionForm.questionType === 'true_false' || questionForm.questionType === 'short_answer' 
          ? questionForm.correctAnswer 
          : undefined,
        explanation: questionForm.explanation,
      };

      const response = await questionAPI.createQuestion(data);
      const newQuestion = response.data.data as Question;
      
      setAvailableQuestions([newQuestion, ...availableQuestions]);
      
      // If we have an exam, add the question to it
      if (examId) {
        await handleAddQuestions([newQuestion.id]);
      }
      
      setCreateQuestionDialogOpen(false);
      resetQuestionForm();
      setSuccess('Question created successfully');
    } catch (err: any) {
      const detail = err.response?.data?.error?.details?.[0]?.message;
      setError(detail || err.response?.data?.message || 'Failed to create question');
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'mcq',
      difficulty: 'medium',
      marks: 1,
      negativeMarks: 0,
      subjectId: '',
      chapterId: '',
      conceptId: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      correctAnswer: '',
      explanation: '',
    });
    setChapters([]);
    setConcepts([]);
    setNewConceptName('');
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/educator/exams')}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {isEditing ? 'Edit Exam' : 'Create New Exam'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditing ? examForm.title : 'Configure your exam settings and add questions'}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !examForm.title}
            >
              Save Draft
            </Button>
            {isEditing && examQuestions.length > 0 && (
              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={handlePublish}
                disabled={isSaving}
                sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>

        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab icon={<SettingsIcon />} label="Basic Info" iconPosition="start" />
            <Tab icon={<QuestionIcon />} label={`Questions (${examQuestions.length})`} iconPosition="start" disabled={!isEditing} />
            <Tab icon={<PeopleIcon />} label="Assignment" iconPosition="start" disabled={!isEditing} />
          </Tabs>
        </Paper>

        {/* Basic Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Left Column - Main Info */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Exam Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Exam Title"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      required
                      placeholder="e.g., Data Structures Mid-Term"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={examForm.description}
                      onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                      placeholder="Brief description of the exam"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Instructions for Students"
                      value={examForm.instructions}
                      onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                      placeholder="Instructions that will be shown before starting the exam"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Exam Type</InputLabel>
                      <Select
                        value={examForm.examType}
                        label="Exam Type"
                        onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                      >
                        <MenuItem value="quiz">Quiz</MenuItem>
                        <MenuItem value="unit_test">Unit Test</MenuItem>
                        <MenuItem value="internal">Internal Assessment</MenuItem>
                        <MenuItem value="midterm">Mid-Term</MenuItem>
                        <MenuItem value="final">Final Exam</MenuItem>
                        <MenuItem value="practice">Practice Test</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Duration (minutes)"
                      value={examForm.durationMinutes}
                      onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                      InputProps={{ inputProps: { min: 5, max: 300 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Marks"
                      value={examForm.totalMarks}
                      onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Passing Marks"
                      value={examForm.passingMarks}
                      onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Attempts"
                      value={examForm.maxAttempts}
                      onChange={(e) => setExamForm({ ...examForm, maxAttempts: Number(e.target.value) })}
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Schedule
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={examForm.startTime}
                      onChange={(date) => setExamForm({ ...examForm, startTime: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={examForm.endTime}
                      onChange={(date) => setExamForm({ ...examForm, endTime: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Right Column - Settings */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Exam Settings
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.shuffleQuestions}
                        onChange={(e) => setExamForm({ ...examForm, shuffleQuestions: e.target.checked })}
                      />
                    }
                    label="Shuffle Questions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.shuffleOptions}
                        onChange={(e) => setExamForm({ ...examForm, shuffleOptions: e.target.checked })}
                      />
                    }
                    label="Shuffle Answer Options"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.showResult}
                        onChange={(e) => setExamForm({ ...examForm, showResult: e.target.checked })}
                      />
                    }
                    label="Show Result After Submit"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.showAnswers}
                        onChange={(e) => setExamForm({ ...examForm, showAnswers: e.target.checked })}
                      />
                    }
                    label="Show Correct Answers"
                  />
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={examForm.negativeMarking}
                        onChange={(e) => setExamForm({ ...examForm, negativeMarking: e.target.checked })}
                      />
                    }
                    label="Negative Marking"
                  />
                  {examForm.negativeMarking && (
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      label="Negative Mark Value"
                      value={examForm.negativeMarkValue}
                      onChange={(e) => setExamForm({ ...examForm, negativeMarkValue: Number(e.target.value) })}
                      InputProps={{ inputProps: { min: 0, max: 5, step: 0.25 } }}
                    />
                  )}
                </Box>
              </Paper>

              {/* Quick Stats */}
              {isEditing && (
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Exam Summary
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Questions</Typography>
                      <Typography fontWeight={600}>{examQuestions.length}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Total Marks</Typography>
                      <Typography fontWeight={600}>{examQuestions.reduce((sum, q) => sum + q.marks, 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Duration</Typography>
                      <Typography fontWeight={600}>{examForm.durationMinutes} min</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Questions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Exam Questions ({examQuestions.length})
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setQuestionDialogOpen(true);
                    fetchQuestionBank();
                  }}
                >
                  Add from Bank
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateQuestionDialogOpen(true)}
                >
                  Create New
                </Button>
              </Box>
            </Box>

            {examQuestions.length === 0 ? (
              <Box textAlign="center" py={6}>
                <QuestionIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No questions added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Add questions from your question bank or create new ones
                </Typography>
              </Box>
            ) : (
              <List>
                {examQuestions.map((question, index) => (
                  <ListItem
                    key={question.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight={600}>Q{index + 1}.</Typography>
                          <Typography>{question.questionText}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            size="small"
                            label={question.questionType}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={question.difficulty}
                            color={getDifficultyColor(question.difficulty) as any}
                          />
                          <Chip
                            size="small"
                            label={`${question.marks} marks`}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </TabPanel>

        {/* Assignment Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Assign Exam To
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Choose who can take this exam. As an educator, you can assign exams to sections within your department.
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Required:</strong> You must assign this exam to at least one section/department or select "All Students" before publishing.
            </Alert>

            <FormControl component="fieldset">
              <RadioGroup
                value={examForm.assignmentMode}
                onChange={(e) => setExamForm({ 
                  ...examForm, 
                  assignmentMode: e.target.value as any,
                  assignedSections: [],
                  assignedDepartments: [],
                })}
              >
                <FormControlLabel value="section" control={<Radio />} label="Specific Sections/Classes (Recommended)" />
                <FormControlLabel value="department" control={<Radio />} label="Entire Department" />
                <FormControlLabel value="all" control={<Radio />} label="All Students in Institution" />
              </RadioGroup>
            </FormControl>

            {examForm.assignmentMode === 'department' && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Departments
                </Typography>
                {availableDepartments.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {availableDepartments.map((dept) => (
                      (() => {
                        const deptId = dept._id || dept.id;
                        if (!deptId) return null;
                        return (
                      <FormControlLabel
                        key={deptId}
                        control={
                          <Checkbox
                            checked={examForm.assignedDepartments.includes(deptId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExamForm({
                                  ...examForm,
                                  assignedDepartments: [...examForm.assignedDepartments, deptId],
                                });
                              } else {
                                setExamForm({
                                  ...examForm,
                                  assignedDepartments: examForm.assignedDepartments.filter(id => id !== deptId),
                                });
                              }
                            }}
                          />
                        }
                        label={`${dept.name} (${dept.code})`}
                      />
                        );
                      })()
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">Your department will be automatically assigned</Alert>
                )}
              </Box>
            )}

            {examForm.assignmentMode === 'section' && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Sections
                </Typography>
                {availableSections.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {availableSections.map((section) => (
                      <FormControlLabel
                        key={section._id}
                        control={
                          <Checkbox
                            checked={examForm.assignedSections.includes(section._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExamForm({
                                  ...examForm,
                                  assignedSections: [...examForm.assignedSections, section._id],
                                });
                              } else {
                                setExamForm({
                                  ...examForm,
                                  assignedSections: examForm.assignedSections.filter(id => id !== section._id),
                                });
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{section.displayName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {section.currentStrength || 0} students
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning">
                    No sections found in your department. Please contact admin to set up sections.
                  </Alert>
                )}
              </Box>
            )}

            {examForm.assignmentMode === 'all' && (
              <Box mt={3}>
                <Alert severity="warning">
                  This exam will be visible to ALL students in the institution. Use with caution.
                </Alert>
              </Box>
            )}

            {/* Selected Summary */}
            {(examForm.assignedSections.length > 0 || examForm.assignedDepartments.length > 0) && (
              <Box mt={3} p={2} bgcolor="success.50" borderRadius={1}>
                <Typography variant="subtitle2" color="success.dark" gutterBottom>
                  Assignment Summary
                </Typography>
                {examForm.assignedSections.length > 0 && (
                  <Typography variant="body2">
                    Sections: {availableSections
                      .filter(s => examForm.assignedSections.includes(s._id))
                      .map(s => s.displayName)
                      .join(', ')}
                  </Typography>
                )}
                {examForm.assignedDepartments.length > 0 && (
                  <Typography variant="body2">
                    Departments: {availableDepartments
                      .filter(d => {
                        const deptId = d._id || d.id;
                        return deptId ? examForm.assignedDepartments.includes(deptId) : false;
                      })
                      .map(d => d.name)
                      .join(', ')}
                  </Typography>
                )}
              </Box>
            )}

            {/* Save Assignment Button */}
            {isEditing && (
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveAssignment}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Assignment'}
                </Button>
              </Box>
            )}
          </Paper>
        </TabPanel>

        {/* Add Questions from Bank Dialog */}
        <Dialog 
          open={questionDialogOpen} 
          onClose={() => setQuestionDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          disableEnforceFocus
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Add Questions from Bank</Typography>
              <IconButton 
                onClick={fetchQuestionBank} 
                size="small" 
                title="Refresh question bank"
                disabled={isLoadingBank}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select questions to add to this exam
            </Typography>
            {isLoadingBank ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">Loading questions...</Typography>
              </Box>
            ) : availableQuestions.length === 0 ? (
              <Box textAlign="center" py={4}>
                <QuestionIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No questions available in the question bank.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                  Create your first question to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setQuestionDialogOpen(false);
                    setCreateQuestionDialogOpen(true);
                  }}
                >
                  Create First Question
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Click on a question to add it to your exam
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {availableQuestions
                    .filter(q => !examQuestions.find(eq => eq.id === q.id))
                    .map((question) => (
                    <ListItem
                      key={question.id}
                      button
                      onClick={() => {
                        handleAddQuestions([question.id]);
                        setSuccess(`Added: ${question.questionText.substring(0, 50)}...`);
                      }}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box display="flex" width="100%" alignItems="center">
                        <Box flex={1}>
                          <Typography variant="body1">{question.questionText}</Typography>
                          <Box display="flex" gap={1} mt={1}>
                            <Chip size="small" label={question.questionType} />
                            <Chip size="small" label={question.difficulty} color={getDifficultyColor(question.difficulty) as any} />
                            <Chip size="small" label={`${question.marks} marks`} />
                          </Box>
                        </Box>
                        <AddIcon color="primary" sx={{ ml: 2 }} />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuestionDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Question Dialog */}
        <Dialog 
          open={createQuestionDialogOpen} 
          onClose={() => setCreateQuestionDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          disableEnforceFocus
        >
          <DialogTitle>Create New Question</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Question Text"
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select
                    value={questionForm.questionType}
                    label="Question Type"
                    onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                  >
                    <MenuItem value="mcq">Multiple Choice</MenuItem>
                    <MenuItem value="true_false">True/False</MenuItem>
                    <MenuItem value="short_answer">Short Answer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={questionForm.difficulty}
                    label="Difficulty"
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Marks"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                />
              </Grid>

              {/* Subject/Chapter/Concept Selection */}
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
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

              {questionForm.questionType === 'mcq' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Answer Options (check the correct answer)
                  </Typography>
                  {questionForm.options.map((option, idx) => (
                    <Box key={idx} display="flex" alignItems="center" gap={2} mb={2}>
                      <Checkbox
                        checked={option.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          // For MCQ, only one can be correct
                          newOptions.forEach((o, i) => o.isCorrect = i === idx && e.target.checked);
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[idx].text = e.target.value;
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

              {questionForm.questionType === 'short_answer' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Correct Answer"
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Explanation (optional)"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateQuestionDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateQuestion}
              disabled={
                !questionForm.questionText ||
                !questionForm.subjectId ||
                !questionForm.chapterId ||
                !questionForm.conceptId ||
                (questionForm.questionType === 'mcq' && questionForm.options.filter((o) => o.text && o.text.trim()).length < 2) ||
                (questionForm.questionType === 'mcq' && !questionForm.options.some((o) => o.isCorrect)) ||
                (['true_false', 'short_answer'].includes(questionForm.questionType) && !questionForm.correctAnswer)
              }
            >
              Create Question
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ExamEditor;
