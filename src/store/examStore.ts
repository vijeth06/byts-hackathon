/**
 * 🎓 Academic Intelligence Platform - Exam Store
 * Zustand store for exam state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Exam, ExamAttempt, Question, StudentAnswer } from '@/types';
import { examAPI } from '@/services/api';

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
  fetchExam: (id: number) => Promise<void>;
  fetchExamById: (id: string) => Promise<void>;
  createExam: (data: any) => Promise<boolean>;
  updateExam: (id: number, data: any) => Promise<boolean>;
  deleteExam: (id: number) => Promise<boolean>;
  publishExam: (id: number) => Promise<boolean>;

  // Actions - Exam taking
  startExam: (examId: number | string) => Promise<boolean>;
  loadAttempt: (attemptId: number) => Promise<void>;
  saveAnswer: (attemptId: string, questionId: string, selectedOptionId?: string, textAnswer?: string) => Promise<void>;
  submitExam: (attemptId: string) => Promise<boolean>;
  navigateToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setTimeRemaining: (seconds: number) => void;

  // Actions - Results
  fetchMyAttempts: (params?: { courseId?: number }) => Promise<void>;
  fetchResults: (attemptId: number) => Promise<ExamAttempt | null>;
  fetchAttemptResults: (attemptId: string) => Promise<ExamAttempt | null>;

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
          set({ exams, isLoadingExams: false });
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
          set({ availableExams: (response.data.data as Exam[]) || [], isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch available exams',
          });
        }
      },

      // Fetch single exam
      fetchExam: async (id: number) => {
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
      fetchExamById: async (id: string) => {
        set({ isLoadingExams: true, examsError: null });
        try {
          const response = await examAPI.getExam(id as any);
          set({ currentExam: response.data.data as Exam, isLoadingExams: false });
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
          interface StartExamResponse {
            attempt: ExamAttempt & { exam?: { durationMinutes: number } };
            questions: Question[];
          }
          const { attempt, questions } = response.data.data as StartExamResponse;

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            currentQuestionIndex: 0,
            answers: new Map(),
            timeRemaining: attempt.exam?.durationMinutes ? attempt.exam.durationMinutes * 60 : 0,
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

      // Load existing attempt
      loadAttempt: async (attemptId: number) => {
        set({ isLoadingExams: true });
        try {
          const response = await examAPI.getAttempt(attemptId);
          interface LoadAttemptResponse {
            attempt: ExamAttempt & { startTime: string; exam: { durationMinutes: number } };
            questions: Question[];
            answers?: StudentAnswer[];
          }
          const { attempt, questions, answers: savedAnswers } = response.data.data as LoadAttemptResponse;

          const answersMap = new Map<string | number, StudentAnswer>();
          savedAnswers?.forEach((a: StudentAnswer) => {
            answersMap.set(a.questionId, a);
          });

          // Calculate remaining time
          const startTime = new Date(attempt.startTime).getTime();
          const elapsed = (Date.now() - startTime) / 1000;
          const remaining = Math.max(0, attempt.exam.durationMinutes * 60 - elapsed);

          set({
            currentAttempt: attempt,
            currentQuestions: questions,
            answers: answersMap,
            timeRemaining: Math.floor(remaining),
            isExamInProgress: true,
            isLoadingExams: false,
          });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to load attempt',
          });
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
          set({ myAttempts: (response.data.data as ExamAttempt[]) || [], isLoadingExams: false });
        } catch (error: any) {
          set({
            isLoadingExams: false,
            examsError: error.response?.data?.message || 'Failed to fetch attempts',
          });
        }
      },

      // Fetch results
      fetchResults: async (attemptId: number): Promise<ExamAttempt | null> => {
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
      fetchAttemptResults: async (attemptId: string): Promise<ExamAttempt | null> => {
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
