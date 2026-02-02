/**
 * 🎓 Academic Intelligence Platform - Forgot Password Page
 */

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Check Your Email
        </Typography>
        
        <Typography variant="body1" color="text.secondary" mb={4}>
          We've sent a password reset link to{' '}
          <Box component="span" fontWeight={600} color="text.primary">
            {email}
          </Box>
          . Please check your inbox and follow the instructions.
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Didn't receive the email? Check your spam folder or{' '}
          <Link
            component="button"
            onClick={() => setIsSubmitted(false)}
            color="primary"
            fontWeight={600}
            underline="hover"
          >
            try again
          </Link>
        </Typography>

        <Button
          component={RouterLink}
          to="/login"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Login
        </Button>
      </Box>
    );
  }

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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
          }}
        >
          <EmailIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Forgot Password?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No worries! Enter your email and we'll send you reset instructions.
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
        value={email}
        onChange={(e) => {
          clearError();
          setEmail(e.target.value);
        }}
        required
        autoComplete="email"
        autoFocus
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          },
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Send Reset Link'
        )}
      </Button>

      {/* Back to Login */}
      <Box textAlign="center">
        <Link
          component={RouterLink}
          to="/login"
          color="text.secondary"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
