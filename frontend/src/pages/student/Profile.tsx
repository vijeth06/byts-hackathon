/**
 * 🎓 Academic Intelligence Platform - Student Profile Page
 * Complete profile with all fields and real API integration
 */

import React, { useState, useEffect } from 'react';
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
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  MenuItem,
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
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Class as ClassIcon,
  ContactPhone as ContactPhoneIcon,
  Groups as GroupsIcon,
  Cancel as CancelIcon,
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

interface ProfileData {
  // Basic info
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  // Academic info
  studentId: string;
  rollNumber: string;
  admissionYear: number | null;
  currentSemester: number | null;
  yearOfStudy: string;
  class: string;
  currentCGPA: number | null;
  // 10th and 12th marks
  marks10th: number | null;
  marks12th: number | null;
  // Institution info (assigned by admin - read only)
  institutionName: string;
  departmentName: string;
  departmentCode: string;
  sectionName: string;
  sectionYear: number | null;
  // Guardian info
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelation: string;
  // Address
  address: string;
  residentialAddress: string;
  city: string;
  state: string;
  pincode: string;
  // Meta
  profileCompleted: boolean;
}

const ProfilePage: React.FC = () => {
  const { updateProfile, changePassword } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    studentId: '',
    rollNumber: '',
    admissionYear: null,
    currentSemester: null,
    yearOfStudy: '',
    class: '',
    currentCGPA: null,
    marks10th: null,
    marks12th: null,
    institutionName: '',
    departmentName: '',
    departmentCode: '',
    sectionName: '',
    sectionYear: null,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: '',
    address: '',
    residentialAddress: '',
    city: '',
    state: '',
    pincode: '',
    profileCompleted: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.data.success && response.data.data) {
          const data = response.data.data as any;
          const fetchedProfile: ProfileData = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            gender: data.gender || '',
            studentId: data.studentId || '',
            rollNumber: data.rollNumber || '',
            admissionYear: data.admissionYear || null,
            currentSemester: data.currentSemester || null,
            yearOfStudy: data.yearOfStudy || '',
            class: data.class || '',
            currentCGPA: data.currentCGPA || null,
            marks10th: data.marks10th || null,
            marks12th: data.marks12th || null,
            institutionName: data.institution?.name || data.institutionName || '',
            departmentName: data.department?.name || data.departmentName || '',
            departmentCode: data.department?.code || data.departmentCode || '',
            sectionName: data.section?.name || data.sectionName || '',
            sectionYear: data.section?.year || null,
            guardianName: data.guardianName || '',
            guardianPhone: data.guardianPhone || '',
            guardianEmail: data.guardianEmail || '',
            guardianRelation: data.guardianRelation || '',
            address: data.address || '',
            residentialAddress: data.residentialAddress || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            profileCompleted: data.profileCompleted || false,
          };
          setProfileData(fetchedProfile);
          setOriginalData(fetchedProfile);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | any>) => {
    const value = e.target.value;
    // Handle numeric fields
    if (field === 'marks10th' || field === 'marks12th') {
      setProfileData({ ...profileData, [field]: value ? parseFloat(value) : null });
    } else {
      setProfileData({ ...profileData, [field]: value });
    }
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
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        yearOfStudy: profileData.yearOfStudy,
        class: profileData.class,
        currentCGPA: profileData.currentCGPA || undefined,
        marks10th: profileData.marks10th || undefined,
        marks12th: profileData.marks12th || undefined,
        guardianName: profileData.guardianName,
        guardianPhone: profileData.guardianPhone,
        guardianEmail: profileData.guardianEmail,
        guardianRelation: profileData.guardianRelation,
        address: profileData.address,
        residentialAddress: profileData.residentialAddress,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
      });

      if (response.data.success) {
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');

        // Update auth store
        await updateProfile({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        });

        // Fetch updated profile to ensure UI reflects saved data
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.data.success && profileResponse.data.data) {
            const data = profileResponse.data.data as any;
            const updatedProfile: ProfileData = {
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phoneNumber: data.phoneNumber || '',
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
              gender: data.gender || '',
              studentId: data.studentId || '',
              rollNumber: data.rollNumber || '',
              admissionYear: data.admissionYear || null,
              currentSemester: data.currentSemester || null,
              yearOfStudy: data.yearOfStudy || '',
              class: data.class || '',
              currentCGPA: data.currentCGPA || null,
              marks10th: data.marks10th || null,
              marks12th: data.marks12th || null,
              institutionName: data.institution?.name || data.institutionName || '',
              departmentName: data.department?.name || data.departmentName || '',
              departmentCode: data.department?.code || data.departmentCode || '',
              sectionName: data.section?.name || data.sectionName || '',
              sectionYear: data.section?.year || null,
              guardianName: data.guardianName || '',
              guardianPhone: data.guardianPhone || '',
              guardianEmail: data.guardianEmail || '',
              guardianRelation: data.guardianRelation || '',
              address: data.address || '',
              residentialAddress: data.residentialAddress || '',
              city: data.city || '',
              state: data.state || '',
              pincode: data.pincode || '',
              profileCompleted: data.profileCompleted || false,
            };
            setProfileData(updatedProfile);
            setOriginalData(updatedProfile);
          }
        } catch (refetchError) {
          console.error('Failed to refetch profile:', refetchError);
        }

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
    setIsEditing(false);
    // Reset form to original values
    if (originalData) {
      setProfileData(originalData);
    }
  };

  const handleChangePassword = async () => {
    // Validate new password strength
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.errors[0]);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match');
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
          Manage your account settings and personal information
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
              Student
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
                  primary={profileData.studentId || profileData.rollNumber || 'N/A'} 
                  secondary="USN / Student ID"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
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
                  primary={profileData.departmentCode ? `${profileData.departmentCode}${profileData.departmentName ? ` - ${profileData.departmentName}` : ''}` : 'Not assigned'} 
                  secondary="Department"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              {profileData.sectionYear && (
                <ListItem>
                  <ListItemIcon>
                    <ClassIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${profileData.sectionYear}${profileData.sectionYear === 1 ? 'st' : profileData.sectionYear === 2 ? 'nd' : profileData.sectionYear === 3 ? 'rd' : 'th'} Year - Section ${profileData.sectionName}`}
                    secondary="Class / Section"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
              {profileData.currentSemester && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Semester ${profileData.currentSemester}`}
                    secondary="Current Semester"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
              {profileData.admissionYear && (
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={profileData.admissionYear}
                    secondary="Admission Year"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Personal Information" />
              <Tab label="Contact Details" />
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
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleProfileChange('dateOfBirth')}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    value={profileData.gender}
                    onChange={handleProfileChange('gender')}
                    disabled={!isEditing}
                  >
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profileData.departmentName ? `${profileData.departmentName} (${profileData.departmentCode})` : (profileData.departmentCode || 'Not assigned')}
                    disabled
                    helperText="Assigned by admin"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Year of Study"
                    value={profileData.yearOfStudy}
                    onChange={handleProfileChange('yearOfStudy')}
                    disabled={!isEditing}
                  >
                    <MenuItem value="">Select Year</MenuItem>
                    <MenuItem value="I">I</MenuItem>
                    <MenuItem value="II">II</MenuItem>
                    <MenuItem value="III">III</MenuItem>
                    <MenuItem value="IV">IV</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Class"
                    value={profileData.class}
                    onChange={handleProfileChange('class')}
                    disabled={!isEditing}
                  >
                    <MenuItem value="">Select Class</MenuItem>
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="C">C</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="10th Mark Percentage"
                    value={profileData.marks10th || ''}
                    onChange={handleProfileChange('marks10th')}
                    disabled={!isEditing}
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="12th Mark Percentage"
                    value={profileData.marks12th || ''}
                    onChange={handleProfileChange('marks12th')}
                    disabled={!isEditing}
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Current CGPA"
                    value={profileData.currentCGPA || ''}
                    onChange={handleProfileChange('currentCGPA')}
                    disabled={!isEditing}
                    inputProps={{ step: '0.01', min: '0', max: '10' }}
                  />
                </Grid>
                <Grid item xs={12}>
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
              </Grid>
            </TabPanel>

            {/* Contact Details */}
            <TabPanel value={tabValue} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Contact Details
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

              <Typography variant="subtitle1" fontWeight={500} color="text.secondary" mb={2}>
                Your Contact Information
              </Typography>
              <Grid container spacing={3}>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={profileData.address}
                    onChange={handleProfileChange('address')}
                    disabled={!isEditing}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <HomeIcon color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Residential Address"
                    value={profileData.residentialAddress}
                    onChange={handleProfileChange('residentialAddress')}
                    disabled={!isEditing}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <HomeIcon color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profileData.city}
                    onChange={handleProfileChange('city')}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={profileData.state}
                    onChange={handleProfileChange('state')}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    value={profileData.pincode}
                    onChange={handleProfileChange('pincode')}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" fontWeight={500} color="text.secondary" mb={2}>
                Guardian / Parent Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Guardian Name"
                    value={profileData.guardianName}
                    onChange={handleProfileChange('guardianName')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Relation"
                    value={profileData.guardianRelation}
                    onChange={handleProfileChange('guardianRelation')}
                    disabled={!isEditing}
                    placeholder="e.g., Father, Mother, Guardian"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Guardian Phone"
                    value={profileData.guardianPhone}
                    onChange={handleProfileChange('guardianPhone')}
                    disabled={!isEditing}
                    placeholder="Enter guardian phone"
                    InputProps={{
                      startAdornment: <ContactPhoneIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Guardian Email"
                    value={profileData.guardianEmail}
                    onChange={handleProfileChange('guardianEmail')}
                    disabled={!isEditing}
                    placeholder="guardian@email.com"
                    InputProps={{
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
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
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    error={Boolean(passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                    helperText={
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
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
                    startIcon={saving ? <CircularProgress size={16} /> : <LockIcon />}
                    onClick={handleChangePassword}
                    disabled={
                      saving ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      passwordForm.newPassword !== passwordForm.confirmPassword
                    }
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

export default ProfilePage;
