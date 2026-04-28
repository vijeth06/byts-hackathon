/**
 * 🎓 Academic Intelligence Platform - Educator Profile Page
 * Complete profile with all fields and real API integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Groups as GroupsIcon,
  Cancel as CancelIcon,
  MenuBook as MenuBookIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store';
import { authAPI } from '@/services/api';
import { validatePassword } from '@/utils/passwordValidation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box pt={3}>{children}</Box>}</div>
);

interface AssignedSection {
  id: string;
  name: string;
  year: number;
  semester: number;
  departmentName?: string;
  departmentCode?: string;
}

interface SubjectTaught {
  id: string;
  name: string;
  code: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Professional info
  employeeId: string;
  designation: string;
  qualification: string;
  specialization: string;
  experience: number | string;
  joiningDate: string;
  // Institution info
  institutionName: string;
  departmentName: string;
  departmentCode: string;
  // Assigned sections & subjects
  assignedSections: AssignedSection[];
  subjectsTaught: SubjectTaught[];
  profileCompleted: boolean;
}

const EducatorProfile: React.FC = () => {
  const { updateProfile, changePassword } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    designation: '',
    qualification: '',
    specialization: '',
    experience: '',
    joiningDate: '',
    institutionName: '',
    departmentName: '',
    departmentCode: '',
    assignedSections: [],
    subjectsTaught: [],
    profileCompleted: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const designationLabels: { [key: string]: string } = {
    'professor': 'Professor',
    'associate_professor': 'Associate Professor',
    'assistant_professor': 'Assistant Professor',
    'hod': 'Head of Department',
    'lecturer': 'Lecturer',
    'visiting_faculty': 'Visiting Faculty',
  };

  const normalizeAssignedSections = (sections: any[] = []): AssignedSection[] =>
    sections.map((section: any) => ({
      id: section?.id || section?._id || section?.sectionId || section,
      name: section?.name || section?.displayName || section?.sectionName || '',
      year: section?.year || section?.academicYear || 0,
      semester: section?.semester || 0,
      departmentName: section?.departmentName || section?.departmentId?.name || '',
      departmentCode: section?.departmentCode || section?.departmentId?.code || '',
    }));

  const fetchProfile = useCallback(async () => {
    if (isEditing) {
      return;
    }
    try {
      const response = await authAPI.getProfile();
      if (response.data.success && response.data.data) {
        const data = response.data.data as any;
        const profile: ProfileData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          employeeId: data.employeeId || '',
          designation: data.designation || '',
          qualification: data.qualification || '',
          specialization: data.specialization || '',
          experience: data.experience || '',
          joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
          institutionName: data.institution?.name || data.institutionName || '',
          departmentName: data.department?.name || data.departmentName || '',
          departmentCode: data.department?.code || data.departmentCode || '',
          assignedSections: normalizeAssignedSections(data.assignedSections),
          subjectsTaught: data.subjectsTaught || [],
          profileCompleted: data.profileCompleted || false,
        };
        setProfileData(profile);
        setOriginalData(profile); // Store original for cancel
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [isEditing]);

  // Fetch profile data on mount and when returning to the page
  useEffect(() => {
    fetchProfile();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    };

    window.addEventListener('focus', fetchProfile);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', fetchProfile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field: 'firstName' | 'lastName' | 'phoneNumber' | 'specialization' | 'qualification' | 'experience') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileData({ ...profileData, [field]: e.target.value });
    };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [field]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorMessage('');

    try {
      const response = await authAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        specialization: profileData.specialization,
        qualification: profileData.qualification,
        experience: typeof profileData.experience === 'string' 
          ? parseInt(profileData.experience) || 0 
          : profileData.experience,
      });

      if (response.data.success) {
        setIsEditing(false);
        setOriginalData(profileData); // Update original data after successful save
        setSuccessMessage('Profile updated successfully!');

        // Update auth store
        await updateProfile({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        });

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to update profile');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restore original data when canceling
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.errors[0]);
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to change password. Check your current password.');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and professional information
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem',
              }}
            >
              {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={1}>
              Educator
            </Typography>

            <Box mb={2}>
              {profileData.profileCompleted ? (
                <Chip label="Profile Complete" color="success" size="small" />
              ) : (
                <Chip label="Profile Incomplete" color="warning" size="small" />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <BadgeIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={profileData.employeeId || 'N/A'} 
                  secondary="Employee ID"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={designationLabels[profileData.designation] || profileData.designation || 'Not set'} 
                  secondary="Designation"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={profileData.email} 
                  secondary="Email"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={profileData.institutionName || 'Kongu Engineering College'} 
                  secondary="Institution"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <GroupsIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={profileData.departmentName ? `${profileData.departmentName} (${profileData.departmentCode})` : 'Not assigned'} 
                  secondary="Department"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              {profileData.experience && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${profileData.experience} years`} 
                    secondary="Experience"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
            </List>

            {profileData.assignedSections.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={500} color="text.secondary" mb={1}>
                  Assigned Sections
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {profileData.assignedSections.map((section, idx) => (
                    <Chip 
                      key={section.id || idx}
                      label={section.year && section.name
                        ? `${section.year}${['st', 'nd', 'rd', 'th'][section.year - 1] || 'th'} Year ${section.departmentCode || ''} - ${section.name}`
                        : (section.name || section.departmentName || section.id || 'Section')
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}

            {profileData.subjectsTaught && profileData.subjectsTaught.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={500} color="text.secondary" mb={1}>
                  Subjects Taught
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {profileData.subjectsTaught.map((subject, idx) => (
                    <Chip 
                      key={subject.id || idx}
                      label={`${subject.name} (${subject.code})`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Personal Information" />
              <Tab label="Professional Details" />
              <Tab label="Change Password" />
            </Tabs>

            {/* Personal Information */}
            <TabPanel value={tabValue} index={0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Personal Information
                </Typography>
                {!isEditing ? (
                  <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <Box>
                    <Button sx={{ mr: 1 }} onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                      Cancel
                    </Button>
                    <Button
                      startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={handleProfileChange('firstName')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={handleProfileChange('lastName')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileData.email}
                    disabled
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange('phoneNumber')}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    InputProps={{
                      startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profileData.departmentName || ''}
                    disabled
                    helperText="Assigned by institution"
                    InputProps={{
                      startAdornment: <GroupsIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={profileData.employeeId}
                    disabled
                    helperText="Assigned by institution"
                    InputProps={{
                      startAdornment: <BadgeIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Professional Details */}
            <TabPanel value={tabValue} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Professional Details
                </Typography>
                {!isEditing ? (
                  <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <Box>
                    <Button sx={{ mr: 1 }} onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                      Cancel
                    </Button>
                    <Button
                      startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={profileData.specialization}
                    onChange={handleProfileChange('specialization')}
                    disabled={!isEditing}
                    placeholder="e.g., Data Structures, Machine Learning"
                    InputProps={{
                      startAdornment: <MenuBookIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Qualification"
                    value={profileData.qualification}
                    onChange={handleProfileChange('qualification')}
                    disabled={!isEditing}
                    placeholder="e.g., Ph.D., M.Tech"
                    InputProps={{
                      startAdornment: <SchoolIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Years of Experience"
                    value={profileData.experience}
                    onChange={handleProfileChange('experience')}
                    disabled={!isEditing}
                    placeholder="e.g., 10 years"
                    InputProps={{
                      startAdornment: <WorkIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Change Password */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Change Password
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange('currentPassword')}
                    InputProps={{
                      startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                      endAdornment: (
                        <Button size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </Button>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    sx={{ mb: 0 }}
                    InputProps={{
                      startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                  <PasswordStrengthIndicator password={passwordForm.newPassword} showDetails={true} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    error={passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword}
                    helperText={
                      passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'Passwords do not match'
                        : ''
                    }
                    InputProps={{
                      startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || saving}
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EducatorProfile;
