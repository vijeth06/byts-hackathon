/**
 * 🎓 Academic Intelligence Platform - App Component
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/store';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentExams = lazy(() => import('@/pages/student/Exams'));
const TakeExam = lazy(() => import('@/pages/student/TakeExam'));
const ExamResults = lazy(() => import('@/pages/student/ExamResults'));
const StudentAnalytics = lazy(() => import('@/pages/student/Analytics'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));
const StudentProfileCompletion = lazy(() => import('@/pages/student/ProfileCompletion'));
const StudentInterventions = lazy(() => import('@/pages/student/Interventions'));

const EducatorDashboard = lazy(() => import('@/pages/educator/Dashboard'));
const ExamManagement = lazy(() => import('@/pages/educator/ExamManagement'));
const ExamEditor = lazy(() => import('@/pages/educator/ExamEditor'));
const QuestionBank = lazy(() => import('@/pages/educator/QuestionBank'));
const ChapterConceptManagement = lazy(() => import('@/pages/educator/ChapterConceptManagement'));
const ClassAnalytics = lazy(() => import('@/pages/educator/ClassAnalytics'));
const StudentProgress = lazy(() => import('@/pages/educator/StudentProgress'));
const EducatorStudentManagement = lazy(() => import('@/pages/educator/StudentManagement'));
const EducatorProfile = lazy(() => import('@/pages/educator/Profile'));
const EducatorInterventions = lazy(() => import('@/pages/educator/Interventions'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const SystemAnalytics = lazy(() => import('@/pages/admin/SystemAnalytics'));

// Loading fallback
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}
  >
    <Box textAlign="center">
      <CircularProgress size={48} thickness={4} />
      <Box mt={2} color="text.secondary" fontWeight={500}>
        Loading...
      </Box>
    </Box>
  </Box>
);

const App: React.FC = () => {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected Student Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/profile/complete" element={<StudentProfileCompletion />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/exam/:examId" element={<TakeExam />} />
          <Route path="/student/results/:attemptId" element={<ExamResults />} />
          <Route path="/student/analytics" element={<StudentAnalytics />} />
          <Route path="/student/interventions" element={<StudentInterventions />} />
        </Route>

        {/* Protected Educator Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['educator']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/educator" element={<EducatorDashboard />} />
          <Route path="/educator/dashboard" element={<EducatorDashboard />} />
          <Route path="/educator/profile" element={<EducatorProfile />} />
          <Route path="/educator/students" element={<EducatorStudentManagement />} />
          <Route path="/educator/exams" element={<ExamManagement />} />
          <Route path="/educator/exams/create" element={<ExamEditor />} />
          <Route path="/educator/exams/:examId/edit" element={<ExamEditor />} />
          <Route path="/educator/questions" element={<QuestionBank />} />
          <Route path="/educator/curriculum" element={<ChapterConceptManagement />} />
          <Route path="/educator/analytics" element={<ClassAnalytics />} />
          <Route path="/educator/interventions" element={<EducatorInterventions />} />
          <Route path="/educator/progress" element={<StudentProgress />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/analytics" element={<SystemAnalytics />} />
        </Route>

        {/* Default Redirects - removed, landing is now at / */}

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
