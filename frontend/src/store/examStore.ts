/**
 * 🎓 Academic Intelligence Platform - Exam Store
 * Zustand store for exam state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Exam, ExamAttempt, Question, StudentAnswer } from '@/types';
import { examAPI } from '@/services/api';

const dedupeById = <T extends { id: string | number }>(items: T[]) => {
  const uniqueMap = new Map<string | number, T>();
  items.forEach((item) => {
    uniqueMap.set(item.id, item);
  });
  return Array.from(uniqueMap.values());
};

interface ExamState {
  // Exam list state
  exams: Exam[];
  availableExams: Exam[];
  currentExam: Exam | null;
  isLoadingExams: boolean;
  examsError: string | null;

  // Attempt state
  currentAttempt: ExamAttempt | null;
  currentQuestions: Question[];
  currentQuestionIndex: number;
  answers: Map<string | number, StudentAnswer>;
  timeRemaining: number;
  isExamInProgress: boolean;

  // Results
  myAttempts: ExamAttempt[];

  // Actions - Exam management
  fetchExams: (params?: { courseId?: number; status?: string }) => Promise<void>;
  fetchAvailableExams: () => Promise<void>;
  fetchExam: (id: number | string) => Promise<void>;
  fetchExamById: (id: number | string) => Promise<void>;
  createExam: (data: any) => Promise<boolean>;
  updateExam: (id: number | string, data: any) => Promise<boolean>;
  deleteExam: (id: number | string) => Promise<boolean>;
  publishExam: (id: number | string) => Promise<boolean>;

  // Actions - Exam taking
  startExam: (examId: number | string) => Promise<boolean>;
  resumeExam: (examId: number | string) => Promise<boolean>;
  loadAttempt: (attemptId: number | string) => Promise<boolean>;
  saveAnswer: (attemptId: string, questionId: string, selectedOptionId?: string, textAnswer?: string) => Promise<void>;
  markQuestionForReview: (attemptId: string, questionId: string, marked: boolean) => Promise<void>;
  skipQuestion: (attemptId: string, questionId: string) => Promise<void>;
  submitExam: (attemptId: string) => Promise<boolean>;
  navigateToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setTimeRemaining: (seconds: number) => void;

  // Actions - Results
  fetchMyAttempts: (params?: { courseId?: number }) => Promise<void>;
  fetchResults: (attemptId: number | string) => Promise<ExamAttempt | null>;
  fetchAttemptResults: (attemptId: number | string) => Promise<ExamAttempt | null>;

  // Utility
  clearCurrentExam: () => void;
  clearError: () => void;
}

export const useExamStore = create<ExamState>()(
  devtools(
    (set, get) => ({
      // Initial state
      exams: [],
      availableExams: [],
      currentExam: null,
      isLoadingExams: false,
      examsError: null,

      currentAttempt: null,
      currentQuestions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      timeRemaining: 0,
      isExamInProgress: false,

      myAttempts: [],

      // Fetch all exams (for educators/admins)
      fetchExams: async (params) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.getExams(params);
          const data = response.data.data as { exams?: Exam[] } | Exam[];
          const exams = Array.isArray(data) ? data : (data?.exams || []);
          set({ exams: dedupeById(exams), isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch exams',
          });
        }
      },

      // Fetch available exams for students
      fetchAvailableExams: async () => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.getAvailableExams();
          const data = response.data.data as { exams?: Exam[] } | Exam[];
          // Handle both array and object with exams property
          const exams = Array.isArray(data) ? data : (data?.exams || []);
          set({ availableExams: dedupeById(exams as Exam[]), isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch available exams',
          });
        }
      },

      // Fetch single exam
      fetchExam: async (id: number | string) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.getExam(id);
          set({ currentExam: response.data.data as Exam, isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch exam',
          });
        }
      },

      // Fetch single exam by string ID
      fetchExamById: async (id: number | string) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.getExam(id as any);
          const exam = response.data.data as Exam;
          set({ 
            currentExam: exam, 
            currentQuestions: exam.questions || [],
            isLoadingExams: false 
          });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch exam',
          });
        }
      },

      // Create exam
      createExam: async (data) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.createExam(data);
          const newExam = response.data.data as Exam;
          set((state) => ({
            exams: [...state.exams, newExam],
            isLoadingExams: false,
          }));
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to create exam',
          });
          return false;
        }
      },

      // Update exam
      updateExam: async (id, data) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.updateExam(id, data);
          const updatedExam = response.data.data as Exam;
          set((state) => ({
            exams: state.exams.map((e) => (e.id === id ? updatedExam : e)),
            currentExam: state.currentExam?.id === id ? updatedExam : state.currentExam,
            isLoadingExams: false,
          }));
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to update exam',
          });
          return false;
        }
      },

      // Delete exam
      deleteExam: async (id) => {
        try {
          await examAPI.deleteExam(id);
          set((state) => ({
            exams: state.exams.filter((e) => e.id !== id),
            currentExam: state.currentExam?.id === id ? null : state.currentExam,
          }));
          return true;
        } catch (error: any) {
          set({ examsError: error.response?.data?.message || 'Failed to delete exam' });
          return false;
        }
      },

      // Publish exam
      publishExam: async (id) => {
        try {
          const response = await examAPI.publishExam(id);
          const updatedExam = response.data.data as Exam;
          set((state) => ({
            exams: state.exams.map((e) => (e.id === id ? updatedExam : e)),
            currentExam: state.currentExam?.id === id ? updatedExam : state.currentExam,
          }));
          return true;
        } catch (error: any) {
          set({ examsError: error.response?.data?.message || 'Failed to publish exam' });
          return false;
        }
      },

      // Start exam attempt
      startExam: async (examId: number | string) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.startExam(examId as any);
          const data = response.data.data as any;
          const attempt = data.attempt || {
            id: data.attemptId,
            examId: data.examId,
            examTitle: data.examTitle,
            status: 'started',
            startedAt: data.startedAt,
            totalMarks: data.totalMarks,
            exam: { durationMinutes: data.durationMinutes },
          } as ExamAttempt;

          const questions = data.questions as Question[];

          const currentExam = {
            id: data.examId,
            title: data.examTitle,
            instructions: data.instructions,
            durationMinutes: data.durationMinutes,
            totalMarks: data.totalMarks,
          } as Exam;

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            currentExam,
            currentQuestionIndex: 0,
            answers: new Map(),
            timeRemaining: data.timeRemaining ?? (data.durationMinutes ? data.durationMinutes * 60 : 0),
            isExamInProgress: true,
            isLoadingExams: false,
          });
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to start exam',
          });
          return false;
        }
      },

      // Resume an in-progress exam attempt
      resumeExam: async (examId: number | string) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.resumeExam(examId as any);
          interface ResumeExamResponse {
            attempt: ExamAttempt & { startedAt: string; exam?: { durationMinutes: number } };
            questions: Question[];
            answers?: StudentAnswer[];
          }
          const resumeData = response.data.data as ResumeExamResponse & {
            examId?: string | number;
            examTitle?: string;
            instructions?: string;
            durationMinutes?: number;
            totalMarks?: number;
          };
          const { attempt, questions, answers: savedAnswers } = resumeData;

          // Build answers map from saved answers
          const answersMap = new Map<string | number, StudentAnswer>();
          savedAnswers?.forEach((a: StudentAnswer) => {
            answersMap.set(a.questionId, a);
          });

          // Calculate remaining time
          const startTime = new Date(attempt.startedAt).getTime();
          const elapsed = (Date.now() - startTime) / 1000;
          const totalTime = attempt.exam?.durationMinutes ? attempt.exam.durationMinutes * 60 : 3600;
          const remaining = Math.max(0, totalTime - elapsed);

          const currentExam = {
            id: resumeData.examId,
            title: resumeData.examTitle,
            instructions: resumeData.instructions,
            durationMinutes: resumeData.durationMinutes,
            totalMarks: resumeData.totalMarks,
          } as Exam;

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            currentExam,
            currentQuestionIndex: 0,
            answers: answersMap,
            timeRemaining: Math.floor(remaining),
            isExamInProgress: true,
            isLoadingExams: false,
          });
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to resume exam',
          });
          return false;
        }
      },

      // Load existing attempt
      loadAttempt: async (attemptId: number | string) => {
        set({ isLoadingExams: true });
        try {
          const response = await examAPI.getAttempt(attemptId);
          interface LoadAttemptResponse {
            attempt?: ExamAttempt & { startedAt?: string; startTime?: string; exam?: { durationMinutes: number } };
            attemptId?: string | number;
            examId?: string | number;
            examTitle?: string;
            durationMinutes?: number;
            questions: Question[];
            answers?: StudentAnswer[];
          }
          const { attempt, questions, answers: savedAnswers } = response.data.data as LoadAttemptResponse;

          const answersMap = new Map<string | number, StudentAnswer>();
          savedAnswers?.forEach((a: StudentAnswer) => {
            answersMap.set(a.questionId, a);
          });

          // Calculate remaining time
          const attemptStart = attempt?.startedAt || attempt?.startTime || (response.data.data as any).startedAt;
          const startTime = attemptStart ? new Date(attemptStart).getTime() : Date.now();
          const elapsed = (Date.now() - startTime) / 1000;
          const totalSeconds = attempt?.exam?.durationMinutes
            ? attempt.exam.durationMinutes * 60
            : ((response.data.data as any).durationMinutes ? (response.data.data as any).durationMinutes * 60 : 3600);
          const remaining = Math.max(0, totalSeconds - elapsed);

          const currentExam = {
            id: (response.data.data as any).examId,
            title: (response.data.data as any).examTitle,
            durationMinutes: (response.data.data as any).durationMinutes,
          } as Exam;

          set({
            currentAttempt: attempt || ({
              id: (response.data.data as any).attemptId,
              examId: (response.data.data as any).examId,
              examTitle: (response.data.data as any).examTitle,
              status: (response.data.data as any).status || 'started',
              startedAt: attemptStart,
              totalMarks: (response.data.data as any).totalMarks,
              exam: { durationMinutes: (response.data.data as any).durationMinutes },
            } as ExamAttempt),
            currentQuestions: questions,
            currentExam,
            answers: answersMap,
            timeRemaining: Math.floor(remaining),
            isExamInProgress: true,
            isLoadingExams: false,
          });
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to load attempt',
          });
          return false;
        }
      },

      // Save answer
      saveAnswer: async (attemptId: string, questionId: string, selectedOptionId?: string, textAnswer?: string) => {
        try {
          await examAPI.saveAnswer(attemptId as any, questionId as any, {
            selectedOptionId,
            textAnswer,
          });
        } catch (error) {
          console.error('Failed to save answer:', error);
          throw error;
        }
      },

      // Mark question for review
      markQuestionForReview: async (attemptId: string, questionId: string, marked: boolean) => {
        try {
          await examAPI.markForReview(attemptId as any, questionId as any, marked);
          // Update local state
          set((state) => {
            const newAnswers = new Map(state.answers);
            const existing = newAnswers.get(questionId);
            if (existing) {
              newAnswers.set(questionId, { ...existing, isMarkedForReview: marked });
            } else {
              newAnswers.set(questionId, { questionId, isMarkedForReview: marked } as StudentAnswer);
            }
            return { answers: newAnswers };
          });
        } catch (error) {
          console.error('Failed to mark for review:', error);
        }
      },

      skipQuestion: async (attemptId: string, questionId: string) => {
        try {
          await examAPI.skipQuestion(attemptId as any, questionId as any);
          set((state) => {
            const newAnswers = new Map(state.answers);
            const existing = newAnswers.get(questionId);
            if (existing) {
              newAnswers.set(questionId, {
                ...existing,
                selectedAnswer: undefined,
                isAnswered: false,
                isMarkedForReview: false,
              } as StudentAnswer);
            }
            return { answers: newAnswers };
          });
        } catch (error) {
          console.error('Failed to skip question:', error);
        }
      },

      // Submit exam
      submitExam: async (attemptId: string) => {
        set({ isLoadingExams: true });
        try {
          await examAPI.submitExam(attemptId as any);
          set({
            isExamInProgress: false,
            isLoadingExams: false,
          });
          return true;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to submit exam',
          });
          return false;
        }
      },

      // Navigation
      navigateToQuestion: (index: number) => {
        const { currentQuestions } = get();
        if (index >= 0 && index < currentQuestions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, currentQuestions } = get();
        if (currentQuestionIndex < currentQuestions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      setTimeRemaining: (seconds: number) => {
        set({ timeRemaining: seconds });
      },

      // Fetch my attempts
      fetchMyAttempts: async (params) => {
        set({ isLoadingExams: true });
        try {
          const response = await examAPI.getMyAttempts(params);
          const data = response.data.data as { attempts?: ExamAttempt[] } | ExamAttempt[];
          // API returns { attempts: [...], pagination: {...} }
          const attempts = Array.isArray(data) ? data : (data?.attempts || []);
          set({ myAttempts: attempts as ExamAttempt[], isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch attempts',
          });
        }
      },

      // Fetch results
      fetchResults: async (attemptId: number | string): Promise<ExamAttempt | null> => {
        set({ isLoadingExams: true });
        try {
          const response = await examAPI.getResults(attemptId);
          set({ isLoadingExams: false });
          return response.data.data as ExamAttempt;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch results',
          });
          return null;
        }
      },

      // Fetch attempt results by string ID
      fetchAttemptResults: async (attemptId: number | string): Promise<ExamAttempt | null> => {
        set({ isLoadingExams: true });
        try {
          const response = await examAPI.getResults(attemptId as any);
          set({ isLoadingExams: false });
          return response.data.data as ExamAttempt;
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch results',
          });
          return null;
        }
      },

      // Utility
      clearCurrentExam: () => {
        set({
          currentExam: null,
          currentAttempt: null,
          currentQuestions: [],
          currentQuestionIndex: 0,
          answers: new Map(),
          timeRemaining: 0,
          isExamInProgress: false,
        });
      },

      clearError: () => set({ examsError: null }),
    }),
    { name: 'ExamStore' }
  )
);

// Selectors
export const selectCurrentQuestion = (state: ExamState) =>
  state.currentQuestions[state.currentQuestionIndex];

export const selectIsLastQuestion = (state: ExamState) =>
  state.currentQuestionIndex === state.currentQuestions.length - 1;

export const selectIsFirstQuestion = (state: ExamState) =>
  state.currentQuestionIndex === 0;

export const selectProgress = (state: ExamState) => ({
  total: state.currentQuestions.length,
  answered: state.answers.size,
  markedForReview: Array.from(state.answers.values()).filter((a) => a.isMarkedForReview).length,
  current: state.currentQuestionIndex + 1,
});

export const selectCurrentAnswer = (state: ExamState) => {
  const currentQuestion = state.currentQuestions[state.currentQuestionIndex];
  return currentQuestion ? state.answers.get(currentQuestion.id) : undefined;
};
