/**
 * 🎓 Academic Intelligence Platform - Institution Settings Page
 * Production version - fetches and saves real data from backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Skeleton,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { analyticsAPI } from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface InstitutionData {
  general: {
    institutionName: string;
    shortName: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    timezone: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    loginMessage: string;
  };
  notifications: {
    emailNotifications: boolean;
    examReminders: boolean;
    resultNotifications: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    maxLoginAttempts: number;
    ipWhitelist: string;
  };
  storage: {
    used: number;
    available: number;
    total: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
  };
}

const defaultSettings: InstitutionData = {
  general: {
    institutionName: '',
    shortName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    timezone: 'UTC',
  },
  branding: {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
    loginMessage: '',
  },
  notifications: {
    emailNotifications: true,
    examReminders: true,
    resultNotifications: true,
    systemAlerts: true,
    marketingEmails: false,
  },
  security: {
    twoFactorRequired: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    maxLoginAttempts: 5,
    ipWhitelist: '',
  },
  storage: {
    used: 0,
    available: 0,
    total: 0,
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
  },
};

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box pt={3}>{children}</Box>}</div>
);

const InstitutionSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const [settings, setSettings] = useState<InstitutionData>(defaultSettings);

  // Fetch institution settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await analyticsAPI.getInstitutionSettings();
        const data = response.data.data as any;

        if (data) {
          setSettings({
            general: {
              institutionName: data.institutionName || data.general?.institutionName || '',
              shortName: data.shortName || data.general?.shortName || '',
              email: data.email || data.general?.email || '',
              phone: data.phone || data.general?.phone || '',
              address: data.address || data.general?.address || '',
              website: data.website || data.general?.website || '',
              timezone: data.timezone || data.general?.timezone || 'UTC',
            },
            branding: data.branding || defaultSettings.branding,
            notifications: data.notifications || defaultSettings.notifications,
            security: data.security || defaultSettings.security,
            storage: data.storage || defaultSettings.storage,
            email: data.emailConfig || data.email || defaultSettings.email,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch settings:', err);
        // Don't show error for 404 - just use defaults
        if (err.response?.status !== 404) {
          setError('Unable to load settings. Using default values.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await analyticsAPI.updateInstitutionSettings(settings);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateGeneral = (field: keyof InstitutionData['general'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
  };

  const updateBranding = (field: keyof InstitutionData['branding'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: value },
    }));
  };

  const updateNotifications = (field: keyof InstitutionData['notifications'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updateSecurity = (field: keyof InstitutionData['security'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }));
  };

  const updateEmail = (field: keyof InstitutionData['email'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      email: { ...prev.email, [field]: value },
    }));
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          <Grid item xs={12} md={9}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Institution Settings</Typography>
          <Typography variant="body1" color="text.secondary">Configure your institution's settings and preferences</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
          onClick={handleSave} 
          disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <List disablePadding>
              {[
                { icon: <BusinessIcon />, label: 'General', index: 0 },
                { icon: <PaletteIcon />, label: 'Branding', index: 1 },
                { icon: <NotificationsIcon />, label: 'Notifications', index: 2 },
                { icon: <SecurityIcon />, label: 'Security', index: 3 },
                { icon: <StorageIcon />, label: 'Storage', index: 4 },
                { icon: <EmailIcon />, label: 'Email', index: 5 },
              ].map((item) => (
                <ListItem
                  key={item.index}
                  button
                  selected={tabValue === item.index}
                  onClick={() => setTabValue(item.index)}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={9}>
          {/* General Settings */}
          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>General Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField 
                    fullWidth 
                    label="Institution Name" 
                    value={settings.general.institutionName} 
                    onChange={(e) => updateGeneral('institutionName', e.target.value)} 
                    sx={{ mb: 2 }} 
                  />
                  <TextField 
                    fullWidth 
                    label="Short Name / Abbreviation" 
                    value={settings.general.shortName} 
                    onChange={(e) => updateGeneral('shortName', e.target.value)} 
                    sx={{ mb: 2 }} 
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth 
                        label="Email" 
                        type="email" 
                        value={settings.general.email} 
                        onChange={(e) => updateGeneral('email', e.target.value)} 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth 
                        label="Phone" 
                        value={settings.general.phone} 
                        onChange={(e) => updateGeneral('phone', e.target.value)} 
                      />
                    </Grid>
                  </Grid>
                  <TextField 
                    fullWidth 
                    label="Address" 
                    multiline 
                    rows={2} 
                    value={settings.general.address} 
                    onChange={(e) => updateGeneral('address', e.target.value)} 
                    sx={{ mt: 2 }} 
                  />
                  <TextField 
                    fullWidth 
                    label="Website" 
                    value={settings.general.website} 
                    onChange={(e) => updateGeneral('website', e.target.value)} 
                    sx={{ mt: 2 }} 
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box position="relative" display="inline-block" mb={2}>
                        <Avatar sx={{ width: 100, height: 100, mx: 'auto', bgcolor: 'primary.main', fontSize: '2rem' }}>
                          {settings.general.shortName || '?'}
                        </Avatar>
                        <IconButton size="small" sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'white', boxShadow: 1 }}>
                          <CameraIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {settings.general.institutionName || 'Your Institution'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {settings.general.email || 'email@example.com'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Branding Settings */}
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Branding & Appearance</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Primary Color</Typography>
                  <Box display="flex" gap={2} alignItems="center" mb={3}>
                    <TextField 
                      type="color" 
                      value={settings.branding.primaryColor} 
                      onChange={(e) => updateBranding('primaryColor', e.target.value)} 
                      sx={{ width: 60 }} 
                    />
                    <TextField 
                      value={settings.branding.primaryColor} 
                      onChange={(e) => updateBranding('primaryColor', e.target.value)} 
                      size="small" 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Secondary Color</Typography>
                  <Box display="flex" gap={2} alignItems="center" mb={3}>
                    <TextField 
                      type="color" 
                      value={settings.branding.secondaryColor} 
                      onChange={(e) => updateBranding('secondaryColor', e.target.value)} 
                      sx={{ width: 60 }} 
                    />
                    <TextField 
                      value={settings.branding.secondaryColor} 
                      onChange={(e) => updateBranding('secondaryColor', e.target.value)} 
                      size="small" 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Login Page Message" 
                    multiline 
                    rows={2} 
                    value={settings.branding.loginMessage} 
                    onChange={(e) => updateBranding('loginMessage', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                  <Box sx={{ 
                    p: 3, 
                    background: `linear-gradient(135deg, ${settings.branding.primaryColor} 0%, ${settings.branding.secondaryColor} 100%)`, 
                    borderRadius: 2, 
                    color: 'white', 
                    textAlign: 'center' 
                  }}>
                    <Typography variant="h5" fontWeight={700}>
                      {settings.general.institutionName || 'Your Institution'}
                    </Typography>
                    <Typography>{settings.branding.loginMessage || 'Welcome message appears here'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Notification Settings */}
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Notification Preferences</Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Email Notifications" secondary="Send notifications via email" />
                  <Switch 
                    checked={settings.notifications.emailNotifications} 
                    onChange={(e) => updateNotifications('emailNotifications', e.target.checked)} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Exam Reminders" secondary="Send reminders before scheduled exams" />
                  <Switch 
                    checked={settings.notifications.examReminders} 
                    onChange={(e) => updateNotifications('examReminders', e.target.checked)} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Result Notifications" secondary="Notify students when results are available" />
                  <Switch 
                    checked={settings.notifications.resultNotifications} 
                    onChange={(e) => updateNotifications('resultNotifications', e.target.checked)} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="System Alerts" secondary="Send alerts for system maintenance and updates" />
                  <Switch 
                    checked={settings.notifications.systemAlerts} 
                    onChange={(e) => updateNotifications('systemAlerts', e.target.checked)} 
                  />
                </ListItem>
              </List>
            </Paper>
          </TabPanel>

          {/* Security Settings */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Security Settings</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.security.twoFactorRequired} 
                        onChange={(e) => updateSecurity('twoFactorRequired', e.target.checked)} 
                      />
                    }
                    label="Require two-factor authentication for all users"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Session Timeout (minutes)" 
                    value={settings.security.sessionTimeout} 
                    onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value) || 30)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max Login Attempts" 
                    value={settings.security.maxLoginAttempts} 
                    onChange={(e) => updateSecurity('maxLoginAttempts', parseInt(e.target.value) || 5)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Minimum Password Length" 
                    value={settings.security.passwordMinLength} 
                    onChange={(e) => updateSecurity('passwordMinLength', parseInt(e.target.value) || 8)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.security.passwordRequireSpecial} 
                        onChange={(e) => updateSecurity('passwordRequireSpecial', e.target.checked)} 
                      />
                    }
                    label="Require special characters in password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="IP Whitelist (comma-separated)" 
                    value={settings.security.ipWhitelist} 
                    onChange={(e) => updateSecurity('ipWhitelist', e.target.value)} 
                    helperText="Leave empty to allow all IPs" 
                  />
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Storage Settings */}
          <TabPanel value={tabValue} index={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Storage & Data</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {settings.storage.used > 0 ? `${settings.storage.used} GB` : '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Used Storage</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {settings.storage.available > 0 ? `${settings.storage.available} GB` : '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Available</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={700}>
                        {settings.storage.total > 0 ? `${settings.storage.total} GB` : '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Quota</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Storage information is calculated from system metrics. Contact support to increase your quota.
                </Typography>
              </Box>
            </Paper>
          </TabPanel>

          {/* Email Settings */}
          <TabPanel value={tabValue} index={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Email Configuration</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="SMTP Host" 
                    placeholder="smtp.example.com" 
                    value={settings.email.smtpHost}
                    onChange={(e) => updateEmail('smtpHost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="SMTP Port" 
                    placeholder="587" 
                    type="number" 
                    value={settings.email.smtpPort}
                    onChange={(e) => updateEmail('smtpPort', parseInt(e.target.value) || 587)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="SMTP Username" 
                    value={settings.email.smtpUsername}
                    onChange={(e) => updateEmail('smtpUsername', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="SMTP Password" 
                    type="password" 
                    value={settings.email.smtpPassword}
                    onChange={(e) => updateEmail('smtpPassword', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="From Email" 
                    placeholder="noreply@institution.edu" 
                    value={settings.email.fromEmail}
                    onChange={(e) => updateEmail('fromEmail', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined">Test Email Configuration</Button>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InstitutionSettings;
