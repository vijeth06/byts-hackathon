/**
 * 🎓 Academic Intelligence Platform - API Client
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APIResponse } from '@/types';

// API base URL - defaults to local backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const ANALYTICS_BASE_URL = import.meta.env.VITE_ANALYTICS_BASE_URL || 'http://localhost:3000/api/v1';

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

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

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
    // Prevent redirect loops
    if (isRedirecting) {
      return Promise.reject(error);
    }
    
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
        .catch((refreshError: AxiosError<APIResponse>) => {
          const refreshStatus = refreshError.response?.status;

          // Only clear session on explicit auth invalidation.
          // For transient failures (503/network), keep tokens so user can retry.
          if (refreshStatus && [400, 401, 403].includes(refreshStatus)) {
            clearTokens();
            if (!isRedirecting && !window.location.pathname.includes('/login')) {
              isRedirecting = true;
              window.location.href = '/login';
            }
          }

          return Promise.reject(refreshError);
        });
    } else {
      clearTokens();
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        window.location.href = '/login';
      }
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
// Auth API
// =====================================================

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<APIResponse>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    institutionId?: number | string;
    departmentId?: number | string;
  }) => api.post<APIResponse>('/auth/register', data),

  logout: () => api.post<APIResponse>('/auth/logout'),

  getProfile: () => api.get<APIResponse>('/users/profile'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    // Student ID fields
    studentId?: string;
    rollNumber?: string;
    // New academic fields
    departmentCode?: string;
    yearOfStudy?: string;
    class?: string;
    currentCGPA?: number;
    marks10th?: number;
    marks12th?: number;
    // Guardian fields
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelation?: string;
    // Address fields
    address?: string;
    residentialAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    // Educator fields
    qualification?: string;
    specialization?: string;
    experience?: number;
  }) => api.put<APIResponse>('/users/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<APIResponse>('/auth/change-password', { currentPassword, newPassword }),

  requestPasswordReset: (email: string) =>
    api.post<APIResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<APIResponse>('/auth/reset-password', { token, password }),

  // User management (admin)
  getUsers: (params?: { role?: string; isActive?: boolean; page?: number; limit?: number }) =>
    api.get<APIResponse>('/auth/users', { params }),

  getStudents: () =>
    api.get<APIResponse>('/users/students'),

  getStudentsByDept: (departmentId: string, studentClass?: string) =>
    api.get<APIResponse>(`/users/students/department/${departmentId}`, { params: { studentClass } }),

  getEducatorStudents: () =>
    api.get<APIResponse>('/users/my-students'),

  // Sections and Departments for exam assignment
  getDepartments: () =>
    api.get<APIResponse>('/users/departments'),

  getSections: (departmentId?: string) =>
    api.get<APIResponse>('/users/sections', { params: { departmentId } }),

  getSectionStudents: (sectionId: string) =>
    api.get<APIResponse>(`/users/sections/${sectionId}/students`),

  getMyStudents: () =>
    api.get<APIResponse>('/users/my-students'),

  getUser: (id: string) => api.get<APIResponse>(`/auth/users/${id}`),

  updateUser: (id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    institutionId?: string;
    departmentId?: string;
    // Educator fields
    employeeId?: string;
    designation?: string;
    assignedSections?: string[];
    // Student fields
    studentId?: string;
    sectionId?: string;
  }) =>
    api.put<APIResponse>(`/auth/users/${id}`, data),

  deleteUser: (id: string) => api.delete<APIResponse>(`/auth/users/${id}`),

  // Institutions
  getInstitutions: () => api.get<APIResponse>('/auth/institutions'),
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
    courseId?: number;
    subjectId?: string;
    totalMarks: number;
    passingMarks?: number;
    passingPercentage?: number;
    durationMinutes: number;
    description?: string;
    instructions?: string;
    examType?: string;
    startTime?: string;
    endTime?: string;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResult?: boolean;
    showAnswers?: boolean;
    maxAttempts?: number;
    negativeMarking?: boolean;
    negativeMarkValue?: number;
    assignedSections?: string[];
    assignedDepartments?: string[];
    assignmentMode?: string;
  }) => api.post<APIResponse>('/exams', data),

  updateExam: (id: number | string, data: {
    title?: string;
    courseId?: number;
    subjectId?: string;
    totalMarks?: number;
    passingMarks?: number;
    durationMinutes?: number;
    description?: string;
    instructions?: string;
    examType?: string;
    startTime?: string;
    endTime?: string;
    shuffleQuestions?: boolean;
    showResult?: boolean;
  }) =>
    api.put<APIResponse>(`/exams/${id}`, data),

  deleteExam: (id: number | string) => api.delete<APIResponse>(`/exams/${id}`),

  getExamPreview: (id: number | string) => api.get<APIResponse>(`/exams/${id}/preview`),

  // Exam lifecycle
  publishExam: (id: number | string) => api.post<APIResponse>(`/exams/${id}/publish`),
  activateExam: (id: number | string) => api.post<APIResponse>(`/exams/${id}/activate`),
  closeExam: (id: number | string) => api.post<APIResponse>(`/exams/${id}/close`),
  archiveExam: (id: number | string) => api.post<APIResponse>(`/exams/${id}/archive`),

  // Exam assignment
  assignExam: (id: number | string, data: {
    sectionIds?: string[];
    departmentIds?: string[];
    studentIds?: string[];
    assignmentMode?: string;
  }) => api.post<APIResponse>(`/exams/${id}/assign`, data),
  
  getExamAssignments: (id: number | string) => api.get<APIResponse>(`/exams/${id}/assignments`),

  // Questions
  getExamQuestions: (examId: number | string) => api.get<APIResponse>(`/exams/${examId}/questions`),

  addQuestionsToExam: (examId: number | string, questionIds: (number | string)[]) =>
    api.post<APIResponse>(`/exams/${examId}/questions`, { questionIds }),

  removeQuestionsFromExam: (examId: number | string, questionIds: (number | string)[]) =>
    api.delete<APIResponse>(`/exams/${examId}/questions`, { data: { questionIds } }),

  // Exam analytics
  getExamAnalytics: (id: number | string) => api.get<APIResponse>(`/exams/${id}/analytics`),
  getExamAttempts: (id: number | string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<APIResponse>(`/exams/${id}/attempts`, { params }),
  exportExamResults: (id: number | string, format?: string) =>
    api.get<APIResponse>(`/exams/${id}/export`, { params: { format } }),

  // Attempts
  getAvailableExams: () => api.get<APIResponse>('/exams/available'),

  startExam: (examId: number | string) => api.post<APIResponse>(`/exams/${examId}/start`),

  resumeExam: (examId: number | string) =>
    api.get<APIResponse>(`/exams/${examId}/resume`),

  getAttempt: (attemptId: number | string) => api.get<APIResponse>(`/exams/attempts/${attemptId}`),

  saveAnswer: (attemptId: number | string, questionId: number | string, data: {
    selectedOptionId?: number | string;
    selectedAnswer?: string;
    textAnswer?: string;
    isMarkedForReview?: boolean;
    timeSpent?: number;
  }) => api.post<APIResponse>(`/exams/attempts/${attemptId}/answers`, { questionId, ...data }),

  markForReview: (attemptId: number | string, questionId: number | string, isMarked: boolean) =>
    api.put<APIResponse>(`/exams/attempts/${attemptId}/mark-review`, { questionId, isMarked }),

  skipQuestion: (attemptId: number | string, questionId: number | string) =>
    api.put<APIResponse>(`/exams/attempts/${attemptId}/skip`, { questionId }),

  submitExam: (attemptId: number | string) => api.post<APIResponse>(`/exams/attempts/${attemptId}/submit`),

  getResults: (attemptId: number | string) => api.get<APIResponse>(`/exams/attempts/${attemptId}/results`),

  getMyAttempts: (params?: { courseId?: number; page?: number; limit?: number }) =>
    api.get<APIResponse>('/exams/my-attempts', { params }),
};

// =====================================================
// Question API
// =====================================================

export const questionAPI = {
  getQuestions: (params?: {
    subjectId?: string;
    chapterId?: string;
    conceptId?: string;
    difficulty?: string;
    questionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<APIResponse>('/questions', { params }),

  createQuestion: (data: {
    questionText: string;
    questionType: string;
    subjectId?: string;
    chapterId?: string;
    conceptId?: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    correctAnswer?: string;
    explanation?: string;
    difficulty?: string;
    marks?: number;
    negativeMarks?: number;
    tags?: string[];
  }) => api.post<APIResponse>('/questions', data),

  updateQuestion: (id: string, data: {
    questionText?: string;
    questionType?: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    correctAnswer?: string;
    explanation?: string;
    difficulty?: string;
    marks?: number;
    negativeMarks?: number;
    tags?: string[];
  }) => api.put<APIResponse>(`/questions/${id}`, data),

  deleteQuestion: (id: string) => api.delete<APIResponse>(`/questions/${id}`),
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

  getMyFeedback: () =>
    api.get<APIResponse>('/analytics/my-feedback'),

  // Student analytics (with IDs)
  getStudentDashboard: (studentId: number, courseId?: number) =>
    api.get<APIResponse>('/analytics/dashboard', { params: { studentId, courseId } }),

  getChapterAnalysis: (studentId: number, courseId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/chapter', { studentId, courseId, examId }),

  getConceptAnalysis: (studentId: number, courseId: number, chapterId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/concept', { studentId, courseId }, { params: { chapterId } }),

  getDifficultyAnalysis: (studentId: number, courseId: number, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/difficulty', { studentId, courseId, examId }),

  getLearningGaps: (studentId: number | string, courseId: number | string) =>
    analyticsApi.post<APIResponse>('/analytics/gaps', { studentId, courseId }),

  getTrend: (studentId: number, courseId: number, windowSize?: number) =>
    analyticsApi.post<APIResponse>('/analytics/trend', { studentId, courseId }, { params: { windowSize } }),

  getFeedback: (studentId: number | undefined, courseId: number | string, examId?: number) =>
    analyticsApi.post<APIResponse>('/analytics/feedback', {
      ...(studentId !== undefined ? { studentId } : {}),
      courseId,
      ...(examId !== undefined ? { examId } : {}),
    }),

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

  getAtRiskStudents: (threshold?: number) =>
    analyticsApi.get<APIResponse>(`/analytics/at-risk`, { params: { threshold } }),

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
// Goal Tracking API
// =====================================================

export const goalAPI = {
  createGoal: (data: {
    studentId: number | string;
    courseId: number | string;
    goalType: string;
    targetMetric: string;
    targetValue: number;
    targetDate: string;
    priority?: string;
    description?: string;
  }) => api.post<APIResponse>('/goals/create', data),

  getStudentGoals: (studentId: number | string, params?: { courseId?: number | string; status?: string }) =>
    api.get<APIResponse>(`/goals/student/${studentId}`, { params }),

  updateProgress: (goalId: number | string, data: { currentValue: number; notes?: string }) =>
    api.post<APIResponse>(`/goals/${goalId}/update-progress`, data),

  getGoalDetails: (goalId: number | string, includeHistory: boolean = true) =>
    api.get<APIResponse>(`/goals/${goalId}`, { params: { includeHistory } }),

  getCourseGoalsSummary: (courseId: number | string) =>
    api.get<APIResponse>(`/goals/course/${courseId}/summary`),
};

// =====================================================
// Notification API
// =====================================================

export const notificationAPI = {
  sendNotification: (data: {
    studentId: number | string;
    courseId?: number | string;
    notificationType: string;
    title: string;
    message: string;
    actionUrl?: string;
    priority?: string;
    metadata?: any;
  }) => api.post<APIResponse>('/notifications/send', data),

  getUserNotifications: (userId: number | string, params?: {
    unreadOnly?: boolean;
    notificationType?: string;
    limit?: number;
  }) => api.get<APIResponse>(`/notifications/user/${userId}`, { params }),

  markAsRead: (notificationId: number | string) =>
    api.post<APIResponse>(`/notifications/${notificationId}/mark-read`),

  setPreferences: (studentId: number | string, preferences: any) =>
    api.post<APIResponse>('/notifications/preferences', { studentId, preferences }),

  getPreferences: (studentId: number | string) =>
    api.get<APIResponse>(`/notifications/preferences/${studentId}`),
};

// =====================================================
// Intervention Tracking API
// =====================================================

export const interventionAPI = {
  createIntervention: (data: {
    studentId: number | string;
    educatorId: number | string;
    courseId: number | string;
    interventionType: string;
    reason: string;
    plannedActions: string;
    targetMetrics?: any;
    estimatedDuration?: number;
  }) => api.post<APIResponse>('/interventions/create', data),

  startIntervention: (interventionId: number | string, data?: { actualStartDate?: string; notes?: string }) =>
    api.post<APIResponse>(`/interventions/${interventionId}/start`, data),

  addCheckin: (interventionId: number | string, data: {
    progress?: string;
    observations: string;
    nextSteps?: string;
    metricsUpdate?: any;
  }) => api.post<APIResponse>(`/interventions/${interventionId}/checkin`, data),

  recordOutcome: (interventionId: number | string, data: {
    outcome: string;
    finalMetrics?: any;
    notes?: string;
    recommendFollowup?: boolean;
  }) => api.post<APIResponse>(`/interventions/${interventionId}/outcome`, data),

  completeIntervention: (interventionId: number | string, data?: { completionDate?: string; finalNotes?: string }) =>
    api.post<APIResponse>(`/interventions/${interventionId}/complete`, data),

  getInterventionDetails: (interventionId: number | string, includeCheckins: boolean = true) =>
    api.get<APIResponse>(`/interventions/${interventionId}`, { params: { includeCheckins } }),

  getStudentInterventions: (studentId: number | string, params?: {
    courseId?: number | string;
    status?: string;
    interventionType?: string;
  }) => api.get<APIResponse>(`/interventions/student/${studentId}`, { params }),

  getEducatorInterventions: (params?: {
    status?: string;
    interventionType?: string;
    page?: number;
    limit?: number;
  }) => api.get<APIResponse>('/interventions/educator', { params }),

  getMyInterventions: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get<APIResponse>('/interventions/my-interventions', { params }),

  getEffectiveness: (params?: {
    courseId?: number;
    educatorId?: number | string;
    interventionType?: string;
  }) => api.get<APIResponse>('/interventions/effectiveness', { params }),
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
};

// =====================================================
// Subject/Chapter/Concept API
// =====================================================

export const subjectAPI = {
  getSubjects: (params?: { page?: number; limit?: number; simple?: boolean }) => 
    api.get<APIResponse>('/subjects', { params }),

  getSubject: (subjectId: string) => 
    api.get<APIResponse>(`/subjects/${subjectId}`),

  getChaptersBySubject: (subjectId: string, params?: { page?: number; limit?: number; simple?: boolean }) => 
    api.get<APIResponse>(`/subjects/${subjectId}/chapters`, { params }),

  createChapter: (subjectId: string, data: { name: string; chapterNumber: number; description?: string }) =>
    api.post<APIResponse>(`/subjects/${subjectId}/chapters`, data),
};

export const chapterAPI = {
  getChapter: (chapterId: string) => 
    api.get<APIResponse>(`/chapters/${chapterId}`),

  updateChapter: (chapterId: string, data: { name?: string; chapterNumber?: number; description?: string }) =>
    api.put<APIResponse>(`/chapters/${chapterId}`, data),

  deleteChapter: (chapterId: string) => 
    api.delete<APIResponse>(`/chapters/${chapterId}`),

  getConceptsByChapter: (chapterId: string, params?: { page?: number; limit?: number; simple?: boolean }) => 
    api.get<APIResponse>(`/chapters/${chapterId}/concepts`, { params }),

  createConcept: (chapterId: string, data: { name: string; description?: string; difficultyLevel?: string }) =>
    api.post<APIResponse>(`/chapters/${chapterId}/concepts`, data),
};

export const conceptAPI = {
  getConcept: (conceptId: string) => 
    api.get<APIResponse>(`/concepts/${conceptId}`),

  updateConcept: (conceptId: string, data: { name?: string; description?: string; difficultyLevel?: string }) =>
    api.put<APIResponse>(`/concepts/${conceptId}`, data),

  deleteConcept: (conceptId: string) => 
    api.delete<APIResponse>(`/concepts/${conceptId}`),
};

// =====================================================
// Question Bank API (merged)
// =====================================================

// The questionAPI was defined earlier in the file.

// =====================================================
// Task API
// =====================================================

export const taskAPI = {
  createTask: (data: {
    title: string;
    description?: string;
    courseId: string;
    taskType: string;
    dueDate: string;
    instructions?: string;
    totalMarks?: number;
  }) => api.post<APIResponse>('/tasks', data),

  getTask: (taskId: string) =>
    api.get<APIResponse>(`/tasks/${taskId}`),

  assignTask: (taskId: string, studentIds: string[]) =>
    api.post<APIResponse>(`/tasks/${taskId}/assign`, { studentIds }),

  getMyTasks: () =>
    api.get<APIResponse>('/tasks/my-tasks'),

  submitTask: (assignmentId: string, submissionUrl: string) =>
    api.put<APIResponse>(`/tasks/assignments/${assignmentId}/submit`, { submissionUrl }),

  getTaskAssignments: (taskId: string) =>
    api.get<APIResponse>(`/tasks/${taskId}/assignments`),
};

// =====================================================
// User API
// =====================================================

export const userAPI = {
  getProfile: () => api.get<APIResponse>('/users/profile'),

  updateProfile: (data: any) =>
    api.put<APIResponse>('/users/profile', data),

  getStudentsByDepartment: (departmentId: string, studentClass?: string) =>
    api.get<APIResponse>(`/users/students/department/${departmentId}`, { params: { studentClass } }),

  getEducatorStudents: () =>
    api.get<APIResponse>('/users/my-students'),

  getAllUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get<APIResponse>('/users/admin/users', { params }),
};

export { api, analyticsApi };
