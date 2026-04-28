/**
 * 🎓 Academic Intelligence Platform - Register Page
 */

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  School as SchoolIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store';
import { UserRole } from '@/types';
import { validatePassword } from '@/utils/passwordValidation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setValidationError('');
    const { name, value } = e.target;
    
    // Allow only alphabets and spaces for name fields
    if (name === 'firstName' || name === 'lastName') {
      const alphabetOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({ ...formData, [name]: alphabetOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = (): boolean => {
    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.errors[0]);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (success) {
      navigate('/login', { 
        state: { message: 'Registration successful! Please sign in.' } 
      });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 450,
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
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #3b82f6 100%)',
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
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join the Academic Intelligence Platform
        </Typography>
      </Box>

      {/* Error Alert */}
      {(error || validationError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {
          clearError();
          setValidationError('');
        }}>
          {error || validationError}
        </Alert>
      )}

      {/* Name Fields */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            autoComplete="given-name"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            autoComplete="family-name"
          />
        </Grid>
      </Grid>

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
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Role Selection */}
      <TextField
        fullWidth
        select
        name="role"
        label="I am a..."
        value={formData.role}
        onChange={handleChange}
        required
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <BadgeIcon color="action" />
            </InputAdornment>
          ),
        }}
      >
        <MenuItem value="student">Student</MenuItem>
        <MenuItem value="educator">Educator</MenuItem>
      </TextField>

      {/* Password Field */}
      <TextField
        fullWidth
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        value={formData.password}
        onChange={handleChange}
        required
        autoComplete="new-password"
        sx={{ mb: 0 }}
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
      <PasswordStrengthIndicator password={formData.password} showDetails={true} />

      {/* Confirm Password Field */}
      <TextField
        fullWidth
        name="confirmPassword"
        type={showPassword ? 'text' : 'password'}
        label="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        autoComplete="new-password"
        sx={{ mt: 1, mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
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
          'Create Account'
        )}
      </Button>

      {/* Login Link */}
      <Typography variant="body2" textAlign="center" color="text.secondary">
        Already have an account?{' '}
        <Link
          component={RouterLink}
          to="/login"
          color="primary"
          fontWeight={600}
          underline="hover"
        >
          Sign in
        </Link>
      </Typography>
    </Box>
  );
};

export default RegisterPage;
