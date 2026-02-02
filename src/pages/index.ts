/**
 * 🎓 Academic Intelligence Platform - Pages Exports
 */

// Auth Pages
export * from './auth';

// Student Pages - with renamed Dashboard
export { 
  Dashboard as StudentDashboard,
  Exams as StudentExams,
  TakeExam,
  ExamResults,
  Analytics as StudentAnalytics,
  Profile as StudentProfile
} from './student';

// Educator Pages - with renamed Dashboard
export {
  Dashboard as EducatorDashboard,
  ExamManagement,
  QuestionBank,
  ClassAnalytics,
  StudentProgress
} from './educator';

// Admin Pages - with renamed Dashboard
export {
  Dashboard as AdminDashboard,
  UserManagement,
  InstitutionSettings,
  SystemAnalytics
} from './admin';
