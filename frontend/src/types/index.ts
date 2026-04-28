/**
 * 🎓 Academic Intelligence Platform - TypeScript Type Definitions
 */

// =====================================================
// User & Authentication Types
// =====================================================

export type UserRole = 'student' | 'educator' | 'admin';

export interface User {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institutionId: number | string;
  departmentId?: number | string;
  profilePicture?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  institution?: {
    id: number | string;
    name: string;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institutionId?: number | string;
  departmentId?: number | string;
}

// =====================================================
// Course & Exam Types
// =====================================================

export interface Institution {
  id: number;
  name: string;
  code: string;
  type: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  institutionId: number;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  departmentId: number;
  educatorId: number;
  educatorName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Chapter {
  id: number;
  name: string;
  description?: string;
  courseId: number;
  sequenceOrder: number;
  prerequisites?: number[];
}

export interface Concept {
  id: number;
  name: string;
  description?: string;
  chapterId: number;
  sequenceOrder: number;
  prerequisites?: number[];
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'coding';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface AnswerOption {
  id: number | string;
  optionText?: string;
  text?: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: number | string;
  questionText?: string;
  text?: string;
  questionType: QuestionType | string;
  difficultyLevel: DifficultyLevel;
  marks: number;
  negativeMarks?: number;
  chapterId?: number | string;
  conceptIds?: (number | string)[];
  options?: AnswerOption[];
  correctAnswer?: string;
  explanation?: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'published';

export interface Exam {
  id: number | string;
  title: string;
  description?: string;
  courseId: number | string;
  courseName?: string;
  courseCode?: string;
  createdBy: number | string;
  status: ExamStatus;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  questionCount?: number;
  questions?: Question[];
  examType?: string;
  createdAt: string;
  // Available exams additional fields
  maxAttempts?: number;
  attemptCount?: number;
  canAttempt?: boolean;
  lastAttemptStatus?: AttemptStatus;
  lastAttemptScore?: number;
  activeAttemptId?: string;
}

// =====================================================
// Exam Attempt Types
// =====================================================

export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated' | 'expired' | 'graded' | 'started' | 'auto_submitted';

export interface ExamAttempt {
  id: number | string;
  attemptId?: number | string;  // MongoDB _id
  examId: number | string;
  examTitle?: string;  // Denormalized exam title from API
  studentId: number | string;
  attemptNumber?: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  totalMarks: number;
  totalScore?: number;
  obtainedMarks?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  grade?: string;
  timeSpent?: number;
  tabSwitches?: number;
  exam?: Exam;
  answers?: StudentAnswer[];
  analytics?: {
    topicPerformance?: { topic: string; correct: number; total: number }[];
  };
  feedback?: {
    strengths?: string[];
    improvements?: string[];
  };
}

export interface StudentAnswer {
  questionId: number | string;
  selectedOptionId?: number | string;
  textAnswer?: string;
  timeSpent?: number;
  isMarkedForReview: boolean;
  isCorrect?: boolean;
}

export interface ExamSession {
  attemptId: number;
  exam: Exam;
  questions: Question[];
  answers: Record<number, StudentAnswer>;
  currentQuestionIndex: number;
  timeRemaining: number;
  status: AttemptStatus;
}

// =====================================================
// Analytics Types
// =====================================================

export type MasteryLevel = 'expert' | 'advanced' | 'intermediate' | 'beginner' | 'novice';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';
export type GapType = 'foundational' | 'conceptual' | 'application' | 'speed';
export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type FeedbackType = 'strength' | 'improvement' | 'recommendation' | 'achievement' | 'warning';
export type PerformanceTag = 'excellent' | 'above_average' | 'average' | 'below_average' | 'needs_improvement';

export interface ChapterPerformance {
  chapterId: number;
  chapterName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  masteryLevel: MasteryLevel;
  avgTimePerQuestion: number;
  totalTimeSpent: number;
  improvementFromLast?: number;
}

export interface ChapterAnalysis {
  studentId: number;
  examId?: number;
  courseId: number;
  analysisDate: string;
  chapters: ChapterPerformance[];
  overallAccuracy: number;
  strongestChapter?: ChapterPerformance;
  weakestChapter?: ChapterPerformance;
}

export interface ConceptPerformance {
  conceptId: number;
  conceptName: string;
  chapterId: number;
  chapterName: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  understandingScore: number;
  timeEfficiency: number;
  consistency: number;
  masteryLevel: MasteryLevel;
  prerequisites: number[];
  isPrerequisiteWeak: boolean;
}

export interface DifficultyPerformance {
  difficulty: DifficultyLevel;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgTime: number;
  benchmark: number;
  performanceTag: PerformanceTag;
  deviationFromBenchmark: number;
}

export interface LearningGap {
  gapId: string;
  gapType: GapType;
  severity: GapSeverity;
  chapterId?: number;
  chapterName?: string;
  conceptId?: number;
  conceptName?: string;
  prerequisiteId?: number;
  prerequisiteName?: string;
  currentAccuracy: number;
  targetAccuracy: number;
  impactScore: number;
  recommendation: string;
  actionItems: string[];
  estimatedFixTime?: string;
}

export interface TrendDataPoint {
  examId: number;
  examDate: string;
  score: number;
  examTitle?: string;
}

export interface PerformanceTrend {
  studentId: number;
  courseId: number;
  analysisDate: string;
  direction: TrendDirection;
  slope: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  consistencyScore: number;
  volatility: number;
  dataPoints: TrendDataPoint[];
  movingAverage: number[];
  predictedNext?: number;
  confidenceLevel: number;
}

export interface FeedbackItem {
  feedbackId: string;
  feedbackType: FeedbackType;
  priority: GapSeverity;
  title: string;
  description: string;
  relatedChapterId?: number;
  relatedConceptId?: number;
  actionItems: string[];
  resources?: { title: string; url: string }[];
}

export interface PersonalizedFeedback {
  studentId: number;
  examId?: number;
  courseId: number;
  generatedAt: string;
  overallScore?: number;
  grade?: string;
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  recommendations: FeedbackItem[];
  achievements: FeedbackItem[];
  warnings: FeedbackItem[];
  summary: string;
}

// =====================================================
// Class Analytics Types (Educator)
// =====================================================

export interface ClassStatistics {
  totalStudents: number;
  submittedCount: number;
  meanScore: number;
  medianScore: number;
  stdDev: number;
  minScore: number;
  maxScore: number;
  passRate: number;
  passThreshold: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface WeakArea {
  chapterId: number;
  chapterName: string;
  conceptId?: number;
  conceptName?: string;
  classAccuracy: number;
  studentsStruggling: number;
  strugglingPercentage: number;
}

export interface QuestionEffectiveness {
  questionId: number;
  questionText?: string;
  difficultyIndex: number;
  discriminationIndex: number;
  effectiveness: string;
  correctCount: number;
  incorrectCount: number;
  commonWrongAnswers: { optionId: number; optionText?: string; selectionCount: number }[];
}

export interface AtRiskStudent {
  studentId: number;
  studentName: string;
  currentScore?: number;
  trend: TrendDirection;
  riskLevel: GapSeverity;
  mainIssues: string[];
  recommendedActions: string[];
}

export interface ClassAnalytics {
  courseId?: number;
  examId?: number;
  educatorId?: number;
  analysisDate?: string;
  statistics?: ClassStatistics;
  gradeDistribution?: GradeDistribution[] | Record<string, number>;
  weakAreas?: WeakArea[];
  questionEffectiveness?: QuestionEffectiveness[];
  atRiskStudents?: AtRiskStudent[];
  recommendations?: string[];
  // Additional flattened properties for convenience
  totalStudents?: number;
  totalExams?: number;
  totalAttempts?: number;
  averageScore?: number;
  passRate?: number;
  performanceByMonth?: Array<{ month: string; avgScore: number; submissions: number }>;
  chapterPerformance?: Array<{ chapter: string; accuracy: number }>;
  conceptMastery?: Array<{ concept: string; mastery: number }>;
  topPerformers?: Array<any>;
  students?: Array<any>;
  examAnalytics?: Array<any>;
  strengthAreas?: Array<any>;
  needsAttention?: Array<any>;
}

// =====================================================
// Dashboard Types
// =====================================================

export interface StudentDashboard {
  studentId: number;
  studentName: string;
  courseId?: number;
  totalExamsTaken: number;
  overallAccuracy: number;
  overallGrade: string;
  classRank?: number;
  percentile?: number;
  recentExams: ExamAttempt[];
  chapterPerformance: ChapterPerformance[];
  difficultyPerformance: Record<DifficultyLevel, DifficultyPerformance>;
  trend: PerformanceTrend;
  learningGaps: LearningGap[];
  recentFeedback: FeedbackItem[];
  achievements: { title: string; description: string; earnedAt: string }[];
}

export interface EducatorDashboard {
  educatorId: number;
  educatorName: string;
  totalCourses: number;
  totalStudents: number;
  totalExamsCreated: number;
  recentExamResults: { examId: number; examTitle: string; avgScore: number; submittedCount: number }[];
  classPerformanceSummary: { courseId: number; courseName: string; avgScore: number; passRate: number }[];
  atRiskStudentsCount: number;
  pendingEvaluations: number;
  averageClassScore: number;
  mostChallengingTopics: WeakArea[];
}

// =====================================================
// API Response Types
// =====================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =====================================================
// Form Types
// =====================================================

export interface ExamFormData {
  title: string;
  description?: string;
  courseId: number;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  scheduledAt?: string;
  instructions?: string;
  shuffleQuestions: boolean;
  showResults: boolean;
}

export interface QuestionFormData {
  questionText: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  marks: number;
  negativeMarks: number;
  chapterId: number;
  conceptIds: number[];
  options?: { optionText: string; isCorrect: boolean; explanation?: string }[];
  correctAnswer?: string;
  explanation?: string;
}

// =====================================================
// UI State Types
// =====================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: string;
  data?: unknown;
}

export interface SidebarState {
  isCollapsed: boolean;
  activeItem: string;
}

// =====================================================
// Type Aliases for compatibility
// =====================================================

// Aliases for store compatibility
export type RegistrationData = RegisterData;
export type StudentDashboardData = StudentDashboard;
export type ExamQuestion = Question;
export type AttemptAnswer = StudentAnswer;
