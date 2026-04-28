/**
 * Student Profile Completion Page
 * Students must complete their profile to be visible to educators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';

interface StudentProfile {
  firstName: string;
  lastName: string;
  email: string;
  studentClass: string;
  studentId: string;
  phoneNumber: string;
  departmentId: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  dateOfBirth: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<StudentProfile>({
    firstName: '',
    lastName: '',
    email: '',
    studentClass: '',
    studentId: '',
    phoneNumber: '',
    departmentId: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    dateOfBirth: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const steps = ['Personal Info', 'Academic Details', 'Contact Info', 'Review & Submit'];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Fetch current user profile
        const response = await authAPI.getProfile();
        const userData = (response.data.data || {}) as Record<string, any>;
        
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          studentClass: userData.studentClass || '',
          studentId: userData.studentId || userData.rollNumber || '',
          phoneNumber: userData.phoneNumber || '',
          departmentId: userData.departmentId || '',
          guardianName: userData.guardianName || '',
          guardianPhone: userData.guardianPhone || '',
          address: userData.address || '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        });

        if (userData.profileCompleted) {
          setProfileCompleted(true);
        }

        // Departments matching database
        setDepartments([
          { _id: '1', name: 'Computer Science and Engineering', code: 'CSE' },
          { _id: '2', name: 'Electronics and Communication Engineering', code: 'ECE' },
          { _id: '3', name: 'Mechanical Engineering', code: 'ME' },
          { _id: '4', name: 'Information Science and Engineering', code: 'ISE' },
          { _id: '5', name: 'Information Technology', code: 'IT' },
        ]);
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load profile',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!profile.firstName || !profile.lastName) {
        setSnackbar({
          open: true,
          message: 'Please fill in your first and last name',
          severity: 'error',
        });
        return;
      }
    } else if (activeStep === 1) {
      if (!profile.departmentId) {
        setSnackbar({
          open: true,
          message: 'Department not assigned. Please contact your administrator.',
          severity: 'error',
        });
        return;
      }
    } else if (activeStep === 2) {
      if (!profile.phoneNumber) {
        setSnackbar({
          open: true,
          message: 'Phone number is required',
          severity: 'error',
        });
        return;
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as { name?: string; value: string };
    if (!name) return;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!profile.departmentId) {
      setSnackbar({
        open: true,
        message: 'Department not assigned. Please contact your administrator to assign a department before completing your profile.',
        severity: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.updateProfile({
        ...profile,
      });

      setSnackbar({
        open: true,
        message: 'Profile updated successfully! You are now visible to educators.',
        severity: 'success',
      });
      setProfileCompleted(true);

      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (profileCompleted) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Profile Complete!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Your profile has been successfully updated. You are now visible to educators in your department.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/student/dashboard')}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            Go to Dashboard
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Complete Your Profile
        </Typography>
        <Typography color="text.secondary">
          Please complete your academic profile to be visible to educators. All fields marked with * are mandatory.
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Paper sx={{ p: 4, mb: 4 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Academic Details
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Department and Class are assigned by your admin. If these fields are empty or incorrect, please contact your administrator to update them.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    name="departmentId"
                    value={profile.departmentId}
                    label="Department *"
                    onChange={handleChange}
                    disabled
                  >
                    <MenuItem value="">Not Assigned</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Class/Batch *"
                  name="studentClass"
                  placeholder="e.g., A, B, 1A, 2B"
                  value={profile.studentClass}
                  onChange={handleChange}
                  required
                />
              </Grid>
              {profile.studentId && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="USN / Student ID"
                    value={profile.studentId}
                    disabled
                    helperText="Assigned by admin. Contact your administrator to update."
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  name="phoneNumber"
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="Enter your residential address"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Name"
                  name="guardianName"
                  value={profile.guardianName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Phone"
                  name="guardianPhone"
                  type="tel"
                  value={profile.guardianPhone}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Review Your Profile
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      First Name
                    </Typography>
                    <Typography variant="body2">{profile.firstName}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Last Name
                    </Typography>
                    <Typography variant="body2">{profile.lastName}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body2">
                      {departments.find((d) => d._id === profile.departmentId)?.name || 'Not selected'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Class
                    </Typography>
                    <Typography variant="body2">{profile.studentClass || 'Not filled'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              {profile.studentId && (
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        USN / Student ID
                      </Typography>
                      <Typography variant="body2">{profile.studentId}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Phone
                    </Typography>
                    <Typography variant="body2">{profile.phoneNumber || 'Not filled'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Alert severity="success" sx={{ mt: 3 }}>
              Once you submit, you will be visible to educators in your department and they can assign tasks to you.
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || submitting}
          variant="outlined"
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            {submitting ? 'Submitting...' : 'Complete Profile'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudentProfilePage;
