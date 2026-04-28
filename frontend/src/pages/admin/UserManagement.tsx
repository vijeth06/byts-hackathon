/**
 * 🎓 Academic Intelligence Platform - User Management Page
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PersonOff as NoUsersIcon,
} from '@mui/icons-material';
import { authAPI } from '@/services/api';
import { validatePassword } from '@/utils/passwordValidation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

interface Department {
  _id: string;
  id?: string;
  name: string;
  code: string;
}

interface Section {
  _id: string;
  name: string;
  year: number;
  displayName?: string;
  departmentCode?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'educator' | 'admin';
  department: string;
  departmentId?: string;
  institutionId: string;
  institutionName: string;
  studentId?: string;
  employeeId?: string;
  designation?: string;
  assignedSections?: string[];
  sectionId?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const extractCollection = (payload: any, preferredKeys: string[] = []): any[] => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    for (const key of preferredKeys) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    const commonKeys = ['items', 'results', 'rows', 'list', 'data'];
    for (const key of commonKeys) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    return [];
  };

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student' as User['role'],
    department: '',
    departmentId: '',
    // Educator-specific fields
    employeeId: '',
    designation: '' as 'professor' | 'associate_professor' | 'assistant_professor' | 'lecturer' | 'hod' | '',
    assignedSections: [] as string[],
    // Student-specific fields
    studentId: '',
    sectionId: '',
    institutionId: '',
    sendInvite: true,
  });

  const normalizeDepartmentId = (u: any) =>
    u.departmentId?._id || u.departmentId || u.department?._id || u.department?.id || '';

  const normalizeAssignedSectionIds = (sectionsList: any[] = []) =>
    sectionsList.map((s: any) => s?._id || s?.id || s);

  const mapUser = (u: any): User => ({
    id: u._id || u.id,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    email: u.email || '',
    role: u.role || 'student',
    department: u.department || '',
    departmentId: normalizeDepartmentId(u),
    institutionId: u.institutionId?._id || u.institutionId || '',
    institutionName: u.institutionId?.name || u.institutionName || 'Kongu Engineering College',
    // Student fields
    studentId: u.studentId || '',
    sectionId: u.sectionId?._id || u.sectionId || '',
    // Educator fields
    employeeId: u.employeeId || '',
    designation: u.designation || '',
    assignedSections: normalizeAssignedSectionIds(u.assignedSections),
    status: u.isActive === false ? 'inactive' : (u.status || 'active'),
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
    lastLogin: u.lastLoginAt ? formatLastLogin(u.lastLoginAt) : 'Never',
  });

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching users...');
      const response = await authAPI.getUsers();
      console.log('Users response:', response.data);
      const userData = extractCollection(response.data.data as any, ['users']);
      
      const formattedUsers: User[] = userData.map(mapUser);
      
      console.log('Formatted users:', formattedUsers.length);
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load users. Please ensure you are logged in as an admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch departments and sections for assignment
  const normalizeSections = (items: Section[] = []) => {
    const seen = new Set<string>();
    return items.filter((section: any) => {
      const id = section?._id || section?.id;
      const key = id || `${section?.departmentCode || ''}|${section?.year || ''}|${section?.name || ''}`;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const uniqueSectionsByLabel = (items: Section[] = []) => {
    const seen = new Set<string>();
    return items.filter((section: any) => {
      const label = section?.displayName || `${section?.year || ''}Y - ${section?.name || ''}`;
      const key = `${label}|${section?.departmentCode || ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const fetchDepartmentsAndSections = useCallback(async () => {
    try {
      const [deptRes, sectRes] = await Promise.all([
        authAPI.getDepartments(),
        authAPI.getSections(),
      ]);
      console.log('Departments fetched:', deptRes.data.data);
      console.log('Sections fetched:', sectRes.data.data);
      const departmentsData = extractCollection(deptRes.data.data as any, ['departments']) as Department[];
      const sectionsData = extractCollection(sectRes.data.data as any, ['sections']) as Section[];

      const normalizedDepartments = departmentsData.map((dept: any) => ({
        _id: dept._id || dept.id,
        id: dept.id || dept._id,
        name: dept.name,
        code: dept.code,
      }));
      setDepartments(normalizedDepartments);
      setSections(normalizeSections(sectionsData));
    } catch (err: any) {
      console.error('Failed to fetch departments/sections:', err);
    }
  }, []);

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (hasFetched || !token) {
      if (!token) setLoading(false);
      return;
    }
    setHasFetched(true);
    fetchUsers();
    fetchDepartmentsAndSections();
  }, [hasFetched]);

  // Auto-load sections when department changes in the form
  useEffect(() => {
    const loadSectionsForDepartment = async () => {
      if (userForm.departmentId) {
        try {
          console.log('Loading sections for department:', userForm.departmentId);
          const response = await authAPI.getSections(userForm.departmentId);
          const sectionsData = normalizeSections(extractCollection(response.data.data as any, ['sections']) as Section[]);
          console.log('Sections loaded:', sectionsData);
          setSections(sectionsData);
        } catch (error: any) {
          console.error('Failed to load sections for department:', error);
        }
      } else {
        // Load all sections if no department selected
        fetchDepartmentsAndSections();
      }
    };
    
    if (createDialogOpen || editDialogOpen) {
      loadSectionsForDepartment();
    }
  }, [userForm.departmentId, createDialogOpen, editDialogOpen]);

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'educator': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const filterUsers = (role?: string) => {
    let filtered = users;
    if (role && role !== 'all') {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditUser = () => {
    if (selectedUser) {
      console.log('Editing user:', selectedUser);
      console.log('User designation:', selectedUser.designation);
      console.log('User assignedSections:', selectedUser.assignedSections);
      console.log('User departmentId:', selectedUser.departmentId);
      
      setUserForm({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        password: '',
        role: selectedUser.role,
        department: selectedUser.department,
        departmentId: selectedUser.departmentId || '',
        institutionId: selectedUser.institutionId || '',
        // Educator fields
        employeeId: selectedUser.employeeId || '',
        designation: (selectedUser.designation || '') as 'professor' | 'associate_professor' | 'assistant_professor' | 'lecturer' | 'hod' | '',
        assignedSections: Array.isArray(selectedUser.assignedSections) 
          ? selectedUser.assignedSections.map((s: any) => {
              const id = typeof s === 'string' ? s : (s?._id || s?.id);
              console.log('Mapping section:', s, '-> ID:', id);
              return id;
            }).filter(Boolean)
          : [],
        // Student fields
        studentId: selectedUser.studentId || '',
        sectionId: selectedUser.sectionId || '',
        sendInvite: false,
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCreateUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    const passwordValidation = validatePassword(userForm.password);
    if (!passwordValidation.isValid) {
      setSnackbar({ open: true, message: passwordValidation.errors[0], severity: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      const createData: any = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        institutionId: 1, // Default institution ID
        departmentId: userForm.departmentId || undefined,
      };

      // Add educator-specific fields
      if (userForm.role === 'educator') {
        createData.employeeId = userForm.employeeId || undefined;
        createData.designation = userForm.designation || undefined;
        createData.assignedSections = userForm.assignedSections.length > 0 ? userForm.assignedSections : undefined;
      }

      // Add student-specific fields
      if (userForm.role === 'student') {
        createData.studentId = userForm.studentId || undefined;
        createData.sectionId = userForm.sectionId || undefined;
      }

      await authAPI.register(createData);
      
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create user', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      departmentId: '',
      employeeId: '',
      designation: '',
      assignedSections: [],
      studentId: '',
      sectionId: '',
      institutionId: '',
      sendInvite: true,
    });
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // Build update data based on role
      const updateData: any = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role,
        departmentId: userForm.departmentId || undefined,
      };

      // Add educator-specific fields
      if (userForm.role === 'educator') {
        updateData.employeeId = userForm.employeeId || undefined;
        updateData.designation = userForm.designation || undefined;
        updateData.assignedSections = userForm.assignedSections.length > 0 ? userForm.assignedSections : undefined;
      }

      // Add student-specific fields
      if (userForm.role === 'student') {
        updateData.studentId = userForm.studentId || undefined;
        updateData.sectionId = userForm.sectionId || undefined;
      }

      const response = await authAPI.updateUser(selectedUser.id, updateData);

      const updated = response.data?.data ? mapUser(response.data.data) : null;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        setSelectedUser((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
      } else {
        fetchUsers();
      }
      
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      if (!updated) {
        fetchUsers();
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update user', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await authAPI.deleteUser(selectedUser.id);
      
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete user', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    const newIsActive = selectedUser.status !== 'active';
    
    setActionLoading(true);
    try {
      await authAPI.updateUser(selectedUser.id, { isActive: newIsActive });
      
      setSnackbar({ open: true, message: `User ${newIsActive ? 'activated' : 'suspended'} successfully`, severity: 'success' });
      handleMenuClose();
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update user status', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteUser = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const filteredUsers = filterUsers(['all', 'student', 'educator', 'admin'][tabValue]);

  const userCounts = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    educators: users.filter((u) => u.role === 'educator').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={fetchUsers}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>User Management</Typography>
          <Typography variant="body1" color="text.secondary">Manage students, educators, and administrators</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>Export</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            Add User
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Total Users', value: userCounts.total, color: '#6366f1' },
          { label: 'Students', value: userCounts.students, color: '#10b981' },
          { label: 'Educators', value: userCounts.educators, color: '#f59e0b' },
          { label: 'Admins', value: userCounts.admins, color: '#ef4444' },
        ].map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
              ) : (
                <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search & Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
        </Box>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${userCounts.total})`} />
          <Tab label={`Students (${userCounts.students})`} />
          <Tab label={`Educators (${userCounts.educators})`} />
          <Tab label={`Admins (${userCounts.admins})`} />
        </Tabs>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Institution</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="rectangular" height={48} /></TableCell>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: user.role === 'admin' ? 'error.main' : user.role === 'educator' ? 'primary.main' : 'success.main' }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>{user.firstName} {user.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" color={getRoleColor(user.role) as any} />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.institutionName} 
                        size="small" 
                        variant={user.institutionId ? 'filled' : 'outlined'}
                        color={user.institutionId ? 'default' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={user.status} size="small" color={getStatusColor(user.status) as any} variant="outlined" />
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <NoUsersIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                    <Typography color="text.secondary">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditUser}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}><EmailIcon fontSize="small" sx={{ mr: 1 }} /> Send Email</MenuItem>
        <MenuItem onClick={handleToggleUserStatus} disabled={actionLoading}>
          {selectedUser?.status === 'active' ? (
            <><BlockIcon fontSize="small" sx={{ mr: 1 }} /> Suspend</>
          ) : (
            <><ActiveIcon fontSize="small" sx={{ mr: 1 }} /> Activate</>
          )}
        </MenuItem>
        <MenuItem onClick={confirmDeleteUser} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete</MenuItem>
      </Menu>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" required value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" required value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} sx={{ mb: 0 }} />
              <PasswordStrengthIndicator password={userForm.password} showDetails={true} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select value={userForm.role} label="Role" onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="educator">Educator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select 
                  value={userForm.departmentId} 
                  label="Department" 
                  onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                >
                  <MenuItem value="">-- Select Department --</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Educator-Specific Fields */}
            {userForm.role === 'educator' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1, mt: 1 }}>
                    Educator Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    label="Employee ID" 
                    placeholder="e.g., CSE001"
                    value={userForm.employeeId} 
                    onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                    helperText="Unique ID assigned by institution"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Designation</InputLabel>
                    <Select 
                      value={userForm.designation} 
                      label="Designation" 
                      onChange={(e) => setUserForm({ ...userForm, designation: e.target.value as any })}
                    >
                      <MenuItem value="">-- Select Designation --</MenuItem>
                      <MenuItem value="professor">Professor</MenuItem>
                      <MenuItem value="associate_professor">Associate Professor</MenuItem>
                      <MenuItem value="assistant_professor">Assistant Professor</MenuItem>
                      <MenuItem value="lecturer">Lecturer</MenuItem>
                      <MenuItem value="hod">Head of Department</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assigned Sections</InputLabel>
                    <Select
                      multiple
                      value={userForm.assignedSections}
                      label="Assigned Sections"
                      onChange={(e) => setUserForm({ ...userForm, assignedSections: e.target.value as string[] })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const section = sections.find(s => s._id === value);
                            return <Chip key={value} label={section?.displayName || section?.name || value} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {uniqueSectionsByLabel(sections)
                        .filter(s => !userForm.departmentId || s.departmentCode === departments.find(d => d._id === userForm.departmentId)?.code)
                        .map((section) => (
                          <MenuItem key={section._id} value={section._id}>
                            {section.displayName || `${section.year}Y - ${section.name}`}
                            {section.departmentCode && ` (${section.departmentCode})`}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Student-Specific Fields */}
            {userForm.role === 'student' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1, mt: 1 }}>
                    Student Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    label="USN / Student ID" 
                    placeholder="e.g., 4JC22CS001"
                    value={userForm.studentId} 
                    onChange={(e) => setUserForm({ ...userForm, studentId: e.target.value })}
                    helperText="Unique Student Number"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Section</InputLabel>
                    <Select 
                      value={userForm.sectionId} 
                      label="Section" 
                      onChange={(e) => setUserForm({ ...userForm, sectionId: e.target.value })}
                    >
                      <MenuItem value="">-- Select Section --</MenuItem>
                      {uniqueSectionsByLabel(sections)
                        .filter(s => !userForm.departmentId || s.departmentCode === departments.find(d => d._id === userForm.departmentId)?.code)
                        .map((section) => (
                          <MenuItem key={section._id} value={section._id}>
                            {section.displayName || `${section.year}Y - ${section.name}`}
                            {section.departmentCode && ` (${section.departmentCode})`}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={userForm.sendInvite} onChange={(e) => setUserForm({ ...userForm, sendInvite: e.target.checked })} />}
                label="Send invitation email"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser} disabled={actionLoading}>
            {actionLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User - {selectedUser?.role === 'educator' ? 'Educator Details' : selectedUser?.role === 'student' ? 'Student Details' : 'Admin Details'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info - All Roles */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={userForm.role} label="Role" onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="educator">Educator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select 
                  value={userForm.departmentId} 
                  label="Department" 
                  onChange={(e) => {
                    setUserForm({ 
                      ...userForm, 
                      departmentId: e.target.value,
                      // Clear section selections when department changes
                      sectionId: '',
                      assignedSections: []
                    });
                  }}
                >
                  <MenuItem value="">-- Select Department --</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Educator-Specific Fields */}
            {userForm.role === 'educator' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                    Educator Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    label="Employee ID" 
                    placeholder="e.g., CSE001"
                    value={userForm.employeeId} 
                    onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                    helperText="Unique ID assigned by institution"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Designation</InputLabel>
                    <Select 
                      value={userForm.designation} 
                      label="Designation" 
                      onChange={(e) => setUserForm({ ...userForm, designation: e.target.value as any })}
                    >
                      <MenuItem value="">-- Select Designation --</MenuItem>
                      <MenuItem value="professor">Professor</MenuItem>
                      <MenuItem value="associate_professor">Associate Professor</MenuItem>
                      <MenuItem value="assistant_professor">Assistant Professor</MenuItem>
                      <MenuItem value="lecturer">Lecturer</MenuItem>
                      <MenuItem value="hod">Head of Department</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assigned Sections</InputLabel>
                    <Select
                      multiple
                      value={userForm.assignedSections}
                      label="Assigned Sections"
                      onChange={(e) => setUserForm({ ...userForm, assignedSections: e.target.value as string[] })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const section = sections.find(s => s._id === value);
                            return <Chip key={value} label={section?.displayName || section?.name || value} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {sections
                        .filter(s => !userForm.departmentId || s.departmentCode === departments.find(d => d._id === userForm.departmentId)?.code)
                        .map((section) => (
                          <MenuItem key={section._id} value={section._id}>
                            {section.displayName || `${section.year}Y - ${section.name}`}
                            {section.departmentCode && ` (${section.departmentCode})`}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Student-Specific Fields */}
            {userForm.role === 'student' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                    Student Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth 
                    label="USN / Student ID" 
                    placeholder="e.g., 4JC22CS001"
                    value={userForm.studentId} 
                    onChange={(e) => setUserForm({ ...userForm, studentId: e.target.value })}
                    helperText="Unique Student Number"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Section</InputLabel>
                    <Select 
                      value={userForm.sectionId} 
                      label="Section" 
                      onChange={(e) => setUserForm({ ...userForm, sectionId: e.target.value })}
                    >
                      <MenuItem value="">-- Select Section --</MenuItem>
                      {sections
                        .filter(s => !userForm.departmentId || s.departmentCode === departments.find(d => d._id === userForm.departmentId)?.code)
                        .map((section) => (
                          <MenuItem key={section._id} value={section._id}>
                            {section.displayName || `${section.year}Y - ${section.name}`}
                            {section.departmentCode && ` (${section.departmentCode})`}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser} disabled={actionLoading}>
            {actionLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={actionLoading}>
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default UserManagement;
