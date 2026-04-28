/**
 * 🎓 Academic Intelligence Platform - Login Page
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Get the redirect path based on user role or from location state
  const getRedirectPath = (role?: string) => {
    const fromPath = (location.state as any)?.from?.pathname;
    
    // If there's a specific path they were trying to access, use that
    if (fromPath && fromPath !== '/' && fromPath !== '/login') {
      return fromPath;
    }
    
    // Otherwise redirect based on role
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'educator':
        return '/educator/dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ email: formData.email, password: formData.password });
    if (success) {
      // Get user from store after login
      const { user: loggedInUser } = useAuthStore.getState();
      const redirectPath = getRedirectPath(loggedInUser?.role);
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
          }}
        >
          <SchoolIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Typography variant="body2" color="primary" fontWeight={600} sx={{ mb: 0.5 }}>
          Kongu Engineering College
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sign in to continue to your dashboard
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Email Field */}
      <TextField
        fullWidth
        name="email"
        type="email"
        label="Email Address"
        value={formData.email}
        onChange={handleChange}
        required
        autoComplete="email"
        autoFocus
        sx={{ mb: 2.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Password Field */}
      <TextField
        fullWidth
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        value={formData.password}
        onChange={handleChange}
        required
        autoComplete="current-password"
        sx={{ mb: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Forgot Password Link */}
      <Box textAlign="right" mb={3}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          color="primary"
          underline="hover"
        >
          Forgot password?
        </Link>
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{
          py: 1.5,
          mb: 3,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #3b82f6 100%)',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #2563eb 100%)',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.5)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Sign In'
        )}
      </Button>

      {/* Divider */}
      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Register Link */}
      <Typography variant="body2" textAlign="center" color="text.secondary">
        Don't have an account?{' '}
        <Link
          component={RouterLink}
          to="/register"
          color="primary"
          fontWeight={600}
          underline="hover"
        >
          Sign up
        </Link>
      </Typography>
    </Box>
  );
};

export default LoginPage;
