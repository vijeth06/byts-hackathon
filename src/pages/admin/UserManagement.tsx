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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'educator' | 'admin';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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
    sendInvite: true,
  });

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.getUsers();
      const userData = response.data.data as any[];
      
      const formattedUsers: User[] = userData.map((u: any) => ({
        id: u._id || u.id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        role: u.role || 'student',
        department: u.department || '',
        status: u.status || 'active',
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        lastLogin: u.lastLogin ? formatLastLogin(u.lastLogin) : 'Never',
      }));
      
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      setUserForm({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        password: '',
        role: selectedUser.role,
        department: selectedUser.department,
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

    setActionLoading(true);
    try {
      await authAPI.register({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        institutionId: 1, // Default institution ID
      });
      
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', department: '', sendInvite: true });
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create user', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await authAPI.updateUser(selectedUser.id, {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role,
      });
      
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      fetchUsers();
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
    
    const newStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
    
    setActionLoading(true);
    try {
      await authAPI.updateUser(selectedUser.id, { status: newStatus });
      
      setSnackbar({ open: true, message: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, severity: 'success' });
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
                <TableCell>Department</TableCell>
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
                    <TableCell>{user.department || '-'}</TableCell>
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
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
              <TextField fullWidth label="Password" type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
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
              <TextField fullWidth label="Department" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} />
            </Grid>
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
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
              <TextField fullWidth label="Department" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} />
            </Grid>
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
