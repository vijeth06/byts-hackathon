/**
 * 🎓 Academic Intelligence Platform - Analytics Store
 * Zustand store for analytics state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ChapterPerformance,
  ConceptPerformance,
  DifficultyPerformance,
  LearningGap,
  PerformanceTrend,
  PersonalizedFeedback,
  ClassAnalytics,
  StudentDashboard,
} from '@/types';
import { analyticsAPI } from '@/services/api';

interface AnalyticsState {
  // Student analytics
  dashboard: StudentDashboard | null;
  studentAnalytics: any | null;
  chapterAnalysis: ChapterPerformance[] | null;
  chapterPerformance: any[] | null;
  conceptAnalysis: ConceptPerformance[] | null;
  conceptMastery: any[] | null;
  difficultyAnalysis: DifficultyPerformance[] | null;
  learningGaps: LearningGap[] | null;
  performanceTrend: any[] | null;
  feedback: PersonalizedFeedback | null;

  // Educator analytics
  classAnalytics: ClassAnalytics | null;
  atRiskStudents: any[] | null;
  classWeakAreas: any[] | null;

  // Loading states
  isLoading: boolean;
  loadingStates: {
    dashboard: boolean;
    chapter: boolean;
    concept: boolean;
    difficulty: boolean;
    gaps: boolean;
    trend: boolean;
    feedback: boolean;
    class: boolean;
  };
  error: string | null;

  // Simplified actions for current user
  fetchStudentAnalytics: () => Promise<void>;
  fetchChapterPerformance: () => Promise<void>;
  fetchConceptMastery: () => Promise<void>;
  fetchDifficultyAnalysis: () => Promise<void>;
  fetchPerformanceTrend: () => Promise<void>;
  fetchLearningGaps: () => Promise<void>;

  // Actions - Student analytics (with IDs)
  fetchDashboard: (studentId: number, courseId?: number) => Promise<void>;
  fetchChapterAnalysis: (studentId: number, courseId: number, examId?: number) => Promise<void>;
  fetchConceptAnalysis: (studentId: number, courseId: number, chapterId?: number) => Promise<void>;
  fetchDifficultyAnalysisById: (studentId: number, courseId: number, examId?: number) => Promise<void>;
  fetchLearningGapsById: (studentId: number, courseId: number) => Promise<void>;
  fetchTrend: (studentId: number, courseId: number, windowSize?: number) => Promise<void>;
  fetchFeedback: (studentId: number, courseId: number, examId?: number) => Promise<void>;
  fetchFullAnalysis: (studentId: number, courseId: number, examId?: number) => Promise<void>;

  // Actions - Educator analytics
  fetchClassAnalytics: (courseId: number, educatorId: number, examId?: number) => Promise<void>;
  fetchAtRiskStudents: (courseId: number, threshold?: number) => Promise<void>;
  fetchClassWeakAreas: (courseId: number, examId?: number, threshold?: number) => Promise<void>;

  // Utility
  clearAnalytics: () => void;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, _get) => ({
      // Initial state
      dashboard: null,
      studentAnalytics: null,
      chapterAnalysis: null,
      chapterPerformance: null,
      conceptAnalysis: null,
      conceptMastery: null,
      difficultyAnalysis: null,
      learningGaps: null,
      performanceTrend: null,
      feedback: null,

      classAnalytics: null,
      atRiskStudents: null,
      classWeakAreas: null,

      isLoading: false,
      loadingStates: {
        dashboard: false,
        chapter: false,
        concept: false,
        difficulty: false,
        gaps: false,
        trend: false,
        feedback: false,
        class: false,
      },
      error: null,

      // Simplified methods for current user (no ID required)
      fetchStudentAnalytics: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyAnalytics();
          set({ studentAnalytics: response.data.data, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch analytics',
          });
        }
      },

      fetchChapterPerformance: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyChapterPerformance();
          set({ chapterPerformance: response.data.data as any[], isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            chapterPerformance: [],
            error: error.response?.data?.message || 'Failed to fetch chapter performance',
          });
        }
      },

      fetchConceptMastery: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyConceptMastery();
          set({ conceptMastery: response.data.data as any[], isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            conceptMastery: [],
            error: error.response?.data?.message || 'Failed to fetch concept mastery',
          });
        }
      },

      fetchDifficultyAnalysis: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyDifficultyAnalysis();
          // Convert to array if needed
          const data = response.data.data;
          const difficultyArray = Array.isArray(data) ? data : (data ? [data] : []);
          set({ difficultyAnalysis: difficultyArray as DifficultyPerformance[], isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            difficultyAnalysis: [],
            error: error.response?.data?.message || 'Failed to fetch difficulty analysis',
          });
        }
      },

      fetchPerformanceTrend: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyPerformanceTrend();
          // Convert to array if needed - API might return trend with dataPoints array
          const data = response.data.data as any;
          let trendArray: any[] = [];
          if (Array.isArray(data)) {
            trendArray = data;
          } else if (data?.dataPoints) {
            trendArray = data.dataPoints;
          } else if (data) {
            trendArray = [data];
          }
          set({ performanceTrend: trendArray, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            performanceTrend: [],
            error: error.response?.data?.message || 'Failed to fetch performance trend',
          });
        }
      },

      fetchLearningGaps: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getMyLearningGaps();
          set({ learningGaps: response.data.data as LearningGap[], isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            learningGaps: [],
            error: error.response?.data?.message || 'Failed to fetch learning gaps',
          });
        }
      },

      // Fetch student dashboard
      fetchDashboard: async (studentId: number, courseId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, dashboard: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getStudentDashboard(studentId, courseId);
          set((state) => ({
            dashboard: response.data.data as StudentDashboard,
            loadingStates: { ...state.loadingStates, dashboard: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, dashboard: false },
            error: error.response?.data?.message || 'Failed to fetch dashboard',
          }));
        }
      },

      // Fetch chapter analysis
      fetchChapterAnalysis: async (studentId: number, courseId: number, examId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, chapter: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getChapterAnalysis(studentId, courseId, examId);
          const responseData = response.data.data as { chapterPerformances?: ChapterPerformance[] } | ChapterPerformance[];
          const chapters = Array.isArray(responseData) ? responseData : (responseData?.chapterPerformances || []);
          set((state) => ({
            chapterAnalysis: chapters,
            loadingStates: { ...state.loadingStates, chapter: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, chapter: false },
            error: error.response?.data?.message || 'Failed to fetch chapter analysis',
          }));
        }
      },

      // Fetch concept analysis
      fetchConceptAnalysis: async (studentId: number, courseId: number, chapterId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, concept: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getConceptAnalysis(studentId, courseId, chapterId);
          const responseData = response.data.data as { conceptPerformances?: ConceptPerformance[] } | ConceptPerformance[];
          const concepts = Array.isArray(responseData) ? responseData : (responseData?.conceptPerformances || []);
          set((state) => ({
            conceptAnalysis: concepts,
            loadingStates: { ...state.loadingStates, concept: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, concept: false },
            error: error.response?.data?.message || 'Failed to fetch concept analysis',
          }));
        }
      },

      // Fetch difficulty analysis by IDs
      fetchDifficultyAnalysisById: async (studentId: number, courseId: number, examId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, difficulty: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getDifficultyAnalysis(studentId, courseId, examId);
          const data = response.data.data;
          const difficultyArray = Array.isArray(data) ? data : (data ? [data] : []);
          set((state) => ({
            difficultyAnalysis: difficultyArray as DifficultyPerformance[],
            loadingStates: { ...state.loadingStates, difficulty: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, difficulty: false },
            error: error.response?.data?.message || 'Failed to fetch difficulty analysis',
          }));
        }
      },

      // Fetch learning gaps by IDs
      fetchLearningGapsById: async (studentId: number, courseId: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, gaps: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getLearningGaps(studentId, courseId);
          const responseData = response.data.data as { learningGaps?: LearningGap[] } | LearningGap[];
          const gaps = Array.isArray(responseData) ? responseData : (responseData?.learningGaps || []);
          set((state) => ({
            learningGaps: gaps,
            loadingStates: { ...state.loadingStates, gaps: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, gaps: false },
            error: error.response?.data?.message || 'Failed to fetch learning gaps',
          }));
        }
      },

      // Fetch trend
      fetchTrend: async (studentId: number, courseId: number, windowSize?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, trend: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getTrend(studentId, courseId, windowSize);
          const data = response.data.data as any;
          let trendArray: any[] = [];
          if (Array.isArray(data)) {
            trendArray = data;
          } else if (data?.dataPoints) {
            trendArray = data.dataPoints;
          } else if (data) {
            trendArray = [data];
          }
          set((state) => ({
            performanceTrend: trendArray,
            loadingStates: { ...state.loadingStates, trend: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, trend: false },
            error: error.response?.data?.message || 'Failed to fetch trend',
          }));
        }
      },

      // Fetch feedback
      fetchFeedback: async (studentId: number, courseId: number, examId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, feedback: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getFeedback(studentId, courseId, examId);
          set((state) => ({
            feedback: response.data.data as PersonalizedFeedback,
            loadingStates: { ...state.loadingStates, feedback: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, feedback: false },
            error: error.response?.data?.message || 'Failed to fetch feedback',
          }));
        }
      },

      // Fetch full analysis (all at once)
      fetchFullAnalysis: async (studentId: number, courseId: number, examId?: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getFullAnalysis(studentId, courseId, examId, {
            includeChapters: true,
            includeConcepts: true,
            includeDifficulty: true,
            includeGaps: true,
            includeTrend: true,
            includeFeedback: true,
          });

          interface FullAnalysisData {
            chapterPerformances?: ChapterPerformance[];
            conceptPerformances?: ConceptPerformance[];
            difficultyPerformance?: DifficultyPerformance;
            learningGaps?: LearningGap[];
            performanceTrend?: PerformanceTrend;
            feedback?: PersonalizedFeedback;
          }
          const data = response.data.data as FullAnalysisData;
          
          // Convert difficulty to array
          const diffArray = data.difficultyPerformance ? [data.difficultyPerformance] : [];
          // Convert trend to array with dataPoints
          let trendArray: any[] = [];
          if (data.performanceTrend?.dataPoints) {
            trendArray = data.performanceTrend.dataPoints;
          } else if (data.performanceTrend) {
            trendArray = [data.performanceTrend];
          }
          
          set({
            chapterAnalysis: data.chapterPerformances || null,
            conceptAnalysis: data.conceptPerformances || null,
            difficultyAnalysis: diffArray,
            learningGaps: data.learningGaps || null,
            performanceTrend: trendArray,
            feedback: data.feedback || null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch full analysis',
          });
        }
      },

      // Fetch class analytics
      fetchClassAnalytics: async (courseId: number, educatorId: number, examId?: number) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, class: true },
          error: null,
        }));
        try {
          const response = await analyticsAPI.getClassAnalytics(courseId, educatorId, examId);
          set((state) => ({
            classAnalytics: response.data.data as ClassAnalytics,
            loadingStates: { ...state.loadingStates, class: false },
          }));
        } catch (error: any) {
          set((state) => ({
            loadingStates: { ...state.loadingStates, class: false },
            error: error.response?.data?.message || 'Failed to fetch class analytics',
          }));
        }
      },

      // Fetch at-risk students
      fetchAtRiskStudents: async (courseId: number, threshold?: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getAtRiskStudents(courseId, threshold);
          set({
            atRiskStudents: response.data.data as any[],
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch at-risk students',
          });
        }
      },

      // Fetch class weak areas
      fetchClassWeakAreas: async (courseId: number, examId?: number, threshold?: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await analyticsAPI.getClassWeakAreas(courseId, examId, threshold);
          set({
            classWeakAreas: response.data.data as any[],
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch class weak areas',
          });
        }
      },

      // Clear all analytics
      clearAnalytics: () => {
        set({
          dashboard: null,
          chapterAnalysis: null,
          conceptAnalysis: null,
          difficultyAnalysis: null,
          learningGaps: null,
          performanceTrend: null,
          feedback: null,
          classAnalytics: null,
          atRiskStudents: null,
          classWeakAreas: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'AnalyticsStore' }
  )
);

// Selectors
export const selectIsAnyLoading = (state: AnalyticsState) =>
  Object.values(state.loadingStates).some(Boolean);

export const selectHasChapterData = (state: AnalyticsState) =>
  state.chapterAnalysis !== null && state.chapterAnalysis.length > 0;

export const selectHasConceptData = (state: AnalyticsState) =>
  state.conceptAnalysis !== null && state.conceptAnalysis.length > 0;

export const selectHasGapsData = (state: AnalyticsState) =>
  state.learningGaps !== null && state.learningGaps.length > 0;

export const selectCriticalGaps = (state: AnalyticsState) =>
  state.learningGaps?.filter((gap) => gap.severity === 'critical') || [];

export const selectOverallTrend = (state: AnalyticsState) =>
  state.performanceTrend && state.performanceTrend.length > 0 
    ? (state.performanceTrend[0] as any)?.direction || null 
    : null;
