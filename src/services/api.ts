/**
 * 🎓 Academic Intelligence Platform - API Client
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APIResponse } from '@/types';

// API base URL - defaults to local backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const ANALYTICS_BASE_URL = import.meta.env.VITE_ANALYTICS_BASE_URL || 'http://localhost:3000/api/v1';

// Mock mode flag
const USE_MOCK = true; // Set to false when backend is ready

// Create axios instance for main backend
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for analytics service
const analyticsApi: AxiosInstance = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 60000, // Longer timeout for analytics
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const getAccessToken = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

export const getRefreshToken = () => {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refreshToken');
  }
  return refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor
const responseInterceptor = (error: AxiosError<APIResponse>) => {
  if (error.response?.status === 401) {
    // Token expired, try to refresh
    const refresh = getRefreshToken();
    if (refresh) {
      return refreshAccessToken(refresh)
        .then((newToken) => {
          if (error.config && error.config.headers) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          }
          throw error;
        })
        .catch(() => {
          clearTokens();
          window.location.href = '/login';
          throw error;
        });
    } else {
      clearTokens();
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

// Apply interceptors
api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use((response) => response, responseInterceptor);
analyticsApi.interceptors.request.use(requestInterceptor);
analyticsApi.interceptors.response.use((response) => response, responseInterceptor);

// Refresh token function
const refreshAccessToken = async (refresh: string): Promise<string> => {
  const response = await axios.post<APIResponse<{ accessToken: string }>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken: refresh }
  );
  const newToken = response.data.data?.accessToken;
  if (newToken) {
    accessToken = newToken;
    localStorage.setItem('accessToken', newToken);
    return newToken;
  }
  throw new Error('Failed to refresh token');
};

// =====================================================
// Mock Data & Helpers
// =====================================================

// Generate mock token
const generateMockToken = () => {
  return 'mock_token_' + Math.random().toString(36).substring(7);
};

// Mock user database (in-memory)
const mockUsers: any[] = [];

// Mock API delay
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock response wrapper
const mockResponse = async <T>(data: T, success: boolean = true, message?: string) => {
  await mockDelay();
  return {
    data: {
      success,
      message: message || (success ? 'Operation successful' : 'Operation failed'),
      data,
    }
  };
};

// =====================================================
// Auth API
// =====================================================

export const authAPI = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      await mockDelay();
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        return {
          data: {
            success: false,
            message: 'Invalid email or password',
            data: null,
          }
        };
      }
      const accessToken = generateMockToken();
      const refreshToken = generateMockToken();
      return {
        data: {
          success: true,
          message: 'Login successful',
          data: {
            user: { ...user, password: undefined },
            accessToken,
            refreshToken,
          }
        }
      };
    }
    return api.post<APIResponse>('/auth/login', { email, password });
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    institutionId: number;
    departmentId?: number;
  }) => {
    if (USE_MOCK) {
      await mockDelay();
      
      // Check if email already exists
      if (mockUsers.find(u => u.email === data.email)) {
        return {
          data: {
            success: false,
            message: 'Email already exists',
            data: null,
          }
        };
      }
      
      // Create new user
      const newUser = {
        _id: 'user_' + (mockUsers.length + 1),
        id: mockUsers.length + 1,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        institutionId: data.institutionId,
        departmentId: data.departmentId,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      
      mockUsers.push(newUser);
      
      const accessToken = generateMockToken();
      const refreshToken = generateMockToken();
      
      return {
        data: {
          success: true,
          message: 'Registration successful!',
          data: {
            user: { ...newUser, password: undefined },
            accessToken,
            refreshToken,
          }
        }
      };
    }
    return api.post<APIResponse>('/auth/register', data);
  },

  logout: () => api.post<APIResponse>('/auth/logout'),

  getProfile: () => api.get<APIResponse>('/auth/profile'),

  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    api.put<APIResponse>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<APIResponse>('/auth/password', { currentPassword, newPassword }),

  requestPasswordReset: (email: string) =>
    api.post<APIResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<APIResponse>('/auth/reset-password', { token, password }),

  // User management (admin)
  getUsers: (params?: { role?: string; status?: string; page?: number; limit?: number }) =>
    api.get<APIResponse>('/auth/users', { params }),

  getUser: (id: string) => api.get<APIResponse>(`/auth/users/${id}`),

  updateUser: (id: string, data: { firstName?: string; lastName?: string; email?: string; role?: string; status?: string }) =>
    api.put<APIResponse>(`/auth/users/${id}`, data),

  deleteUser: (id: string) => api.delete<APIResponse>(`/auth/users/${id}`),
};

// =====================================================
// Exam API
// =====================================================

export const examAPI = {
  // Exam management
  getExams: (params?: { courseId?: number; status?: string; page?: number; limit?: number }) =>
    api.get<APIResponse>('/exams', { params }),

  getExam: (id: number | string) => api.get<APIResponse>(`/exams/${id}`),

  createExam: (data: {
    title: string;
    courseId: number;
    totalMarks: number;
    passingMarks: number;
    durationMinutes: number;
    description?: string;
    instructions?: string;
    scheduledAt?: string;
    shuffleQuestions?: boolean;
    showResults?: boolean;
  }) => api.post<APIResponse>('/exams', data),

  updateExam: (id: number | string, data: {
    title?: string;
    courseId?: number;
    totalMarks?: number;
    passingMarks?: number;
    durationMinutes?: number;
    description?: string;
    instructions?: string;
    scheduledAt?: string;
    shuffleQuestions?: boolean;
    showResults?: boolean;
  }) =>
    api.put<APIResponse>(`/exams/${id}`, data),

  deleteExam: (id: number | string) => api.delete<APIResponse>(`/exams/${id}`),

  publishExam: (id: number | string) => api.post<APIResponse>(`/exams/${id}/publish`),

  // Questions
  getExamQuestions: (examId: number | string) => api.get<APIResponse>(`/exams/${examId}/questions`),

  addQuestionToExam: (examId: number | string, questionId: number | string) =>
    api.post<APIResponse>(`/exams/${examId}/questions`, { questionId }),

  removeQuestionFromExam: (examId: number | string, questionId: number | string) =>
    api.delete<APIResponse>(`/exams/${examId}/questions/${questionId}`),

  // Attempts
  getAvailableExams: () => api.get<APIResponse>('/exams/available'),

  startExam: (examId: number | string) => api.post<APIResponse>(`/exams/${examId}/start`),

  getAttempt: (attemptId: number | string) => api.get<APIResponse>(`/exams/attempts/${attemptId}`),

  saveAnswer: (attemptId: number | string, questionId: number | string, data: {
    selectedOptionId?: number | string;
    textAnswer?: string;
    isMarkedForReview?: boolean;
    timeSpent?: number;
  }) => api.post<APIResponse>(`/exams/attempts/${attemptId}/answers`, { questionId, ...data }),

  submitExam: (attemptId: number | string) => api.post<APIResponse>(`/exams/attempts/${attemptId}/submit`),

  getResults: (attemptId: number | string) => api.get<APIResponse>(`/exams/attempts/${attemptId}/results`),

  getMyAttempts: (params?: { courseId?: number; page?: number; limit?: number }) =>
    api.get<APIResponse>('/exams/my-attempts', { params }),
};

// =====================================================
// Analytics API
// =====================================================

export const analyticsAPI = {
  // Simplified methods for current user (no IDs required)
  getMyAnalytics: () =>
    api.get<APIResponse>('/analytics/my-analytics'),

  getMyChapterPerformance: () =>
    api.get<APIResponse>('/analytics/my-chapter-performance'),

  getMyConceptMastery: () =>
    api.get<APIResponse>('/analytics/my-concept-mastery'),

  getMyDifficultyAnalysis: () =>
    api.get<APIResponse>('/analytics/my-difficulty-analysis'),

  getMyPerformanceTrend: () =>
    api.get<APIResponse>('/analytics/my-performance-trend'),

  getMyLearningGaps: () =>
    api.get<APIResponse>('/analytics/my-learning-gaps'),

  // Student analytics (with IDs)
  getStudentDashboard: (studentId: number, courseId?: number) =>
    api.get<APIResponse>('/analytics/dashboard', { params: { studentId, courseId } }),

  getChapterAnalysis: (studentId: number, courseId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/chapter', { studentId, courseId, examId }),

  getConceptAnalysis: (studentId: number, courseId: number, chapterId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/concept', { studentId, courseId }, { params: { chapterId } }),

  getDifficultyAnalysis: (studentId: number, courseId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/difficulty', { studentId, courseId, examId }),

  getLearningGaps: (studentId: number, courseId: number) =>
    analyticsApi.post<APIResponse>('/analytics/gaps', { studentId, courseId }),

  getTrend: (studentId: number, courseId: number, windowSize?: number) =>
    analyticsApi.post<APIResponse>('/analytics/trend', { studentId, courseId }, { params: { windowSize } }),

  getFeedback: (studentId: number, courseId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/feedback', { studentId, courseId, examId }),

  getFullAnalysis: (studentId: number, courseId: number, examId?: number, options?: {
    includeChapters?: boolean;
    includeConcepts?: boolean;
    includeDifficulty?: boolean;
    includeGaps?: boolean;
    includeTrend?: boolean;
    includeFeedback?: boolean;
  }) =>
    analyticsApi.post<APIResponse>('/analytics/full', {
      studentId,
      courseId,
      examId,
      ...options,
    }),

  // Class analytics (educator)
  getClassAnalytics: (courseId: number, educatorId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/class', { courseId, educatorId, examId }),

  getAtRiskStudents: (courseId: number, threshold?: number) =>
    analyticsApi.get<APIResponse>(`/analytics/class/${courseId}/at-risk`, { params: { threshold } }),

  getClassWeakAreas: (courseId: number, examId?: number, threshold?: number) =>
    analyticsApi.get<APIResponse>(`/analytics/class/${courseId}/weak-areas`, { params: { examId, threshold } }),

  // Comparisons
  compareStudentToClass: (studentId: number, courseId: number) =>
    analyticsApi.get<APIResponse>('/analytics/compare/student-to-class', { params: { studentId, courseId } }),

  getMultiDimensionTrend: (studentId: number, courseId: number) =>
    analyticsApi.get<APIResponse>(`/analytics/multi-dimension/${studentId}/${courseId}`),

  // System analytics (admin)
  getSystemAnalytics: () =>
    analyticsApi.get<APIResponse>('/analytics/system'),

  // Institution settings (admin)
  getInstitutionSettings: () =>
    api.get<APIResponse>('/settings/institution'),

  updateInstitutionSettings: (settings: any) =>
    api.put<APIResponse>('/settings/institution', settings),
};

// =====================================================
// Course API
// =====================================================

export const courseAPI = {
  getCourses: (params?: { departmentId?: number; page?: number; limit?: number }) =>
    api.get<APIResponse>('/courses', { params }),

  getCourse: (id: number) => api.get<APIResponse>(`/courses/${id}`),

  getEnrolledCourses: () => api.get<APIResponse>('/courses/enrolled'),

  enrollInCourse: (courseId: number) => api.post<APIResponse>(`/courses/${courseId}/enroll`),

  getChapters: (courseId: number) => api.get<APIResponse>(`/courses/${courseId}/chapters`),

  getConcepts: (chapterId: number) => api.get<APIResponse>(`/chapters/${chapterId}/concepts`),
};

// =====================================================
// Question Bank API
// =====================================================

export const questionAPI = {
  getQuestions: (params?: {
    chapterId?: number;
    conceptId?: number;
    difficultyLevel?: string;
    questionType?: string;
    page?: number;
    limit?: number;
  }) => api.get<APIResponse>('/questions', { params }),

  getQuestion: (id: number) => api.get<APIResponse>(`/questions/${id}`),

  createQuestion: (data: {
    questionText: string;
    questionType: string;
    difficultyLevel: string;
    marks: number;
    negativeMarks?: number;
    chapterId: number;
    conceptIds?: number[];
    options?: { optionText: string; isCorrect: boolean; explanation?: string }[];
    correctAnswer?: string;
    explanation?: string;
  }) => api.post<APIResponse>('/questions', data),

  updateQuestion: (id: number, data: {
    questionText?: string;
    questionType?: string;
    difficultyLevel?: string;
    marks?: number;
    negativeMarks?: number;
    chapterId?: number;
    conceptIds?: number[];
    options?: { optionText: string; isCorrect: boolean; explanation?: string }[];
    correctAnswer?: string;
    explanation?: string;
  }) =>
    api.put<APIResponse>(`/questions/${id}`, data),

  deleteQuestion: (id: number) => api.delete<APIResponse>(`/questions/${id}`),
};

export { api, analyticsApi };
