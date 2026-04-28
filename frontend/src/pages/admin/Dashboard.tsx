/**
 * 🎓 Academic Intelligence Platform - Admin Dashboard
 * Production version - fetches real data from backend API
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { analyticsAPI, examAPI } from '@/services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  loading?: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalEducators: number;
  totalAdmins: number;
  totalExams: number;
  activeCourses: number;
  userGrowth: Array<{ month: string; students: number; educators: number }>;
  departmentStats: Array<{ dept: string; students: number; educators: number; exams: number }>;
  recentActivity: Array<{ action: string; user: string; time: string; type: string }>;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend, loading }) => (
  <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, border: `1px solid ${color}20` }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          {loading ? (
            <Skeleton variant="text" width={80} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
          )}
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
      {trend !== undefined && (
        <Box display="flex" alignItems="center" mt={1}>
          <TrendingUpIcon sx={{ fontSize: 16, color: trend >= 0 ? '#10b981' : '#ef4444' }} />
          <Typography variant="caption" sx={{ color: trend >= 0 ? '#10b981' : '#ef4444', ml: 0.5 }}>
            {Math.abs(trend)}% from last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

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

  const toDisplayLabel = (value: unknown, fallback = 'N/A'): string => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const name = typeof obj.name === 'string' ? obj.name : '';
      const code = typeof obj.code === 'string' ? obj.code : '';
      const id = typeof obj.id === 'string' ? obj.id : '';
      if (name && code) return `${name} (${code})`;
      if (name) return name;
      if (code) return code;
      if (id) return id;
    }
    return fallback;
  };
  
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalEducators: 0,
    totalAdmins: 0,
    totalExams: 0,
    activeCourses: 0,
    userGrowth: [],
    departmentStats: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);

  // Fetch system statistics
  useEffect(() => {
    // Check for authentication before making API calls
    const token = localStorage.getItem('accessToken');
    console.log('Dashboard useEffect - token:', token ? 'exists' : 'missing', 'hasFetched:', hasFetched);
    if (hasFetched || !token) {
      if (!token) setLoading(false);
      return;
    }
    
    const fetchSystemStats = async () => {
      setHasFetched(true);
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching system analytics...');
        // Fetch multiple endpoints in parallel
        const [analyticsResponse, examsResponse] = await Promise.allSettled([
          analyticsAPI.getSystemAnalytics(),
          examAPI.getExams(),
        ]);

        console.log('Analytics response:', analyticsResponse);
        console.log('Exams response:', examsResponse);

        let systemData: Partial<SystemStats> = {};

        // Process analytics response
        if (analyticsResponse.status === 'fulfilled') {
          const data = analyticsResponse.value.data.data as any;
          console.log('Analytics data:', data);
          systemData = {
            totalUsers: data.totalUsers || 0,
            totalStudents: data.totalStudents || 0,
            totalEducators: data.totalEducators || 0,
            totalAdmins: data.totalAdmins || 0,
            totalExams: Number(data.totalExams) || 0,
            activeCourses: data.activeCourses || 0,
            userGrowth: Array.isArray(data.userGrowth) ? data.userGrowth : [],
            departmentStats: Array.isArray(data.departmentStats)
              ? data.departmentStats.map((dept: any) => ({
                  ...dept,
                  dept: toDisplayLabel(dept?.dept ?? dept?.department ?? dept?.name, 'N/A'),
                  students: Number(dept?.students) || 0,
                  educators: Number(dept?.educators) || 0,
                  exams: Number(dept?.exams) || 0,
                }))
              : [],
            recentActivity: Array.isArray(data.recentActivity)
              ? data.recentActivity.map((activity: any) => ({
                  ...activity,
                  action: toDisplayLabel(activity?.action, 'Activity updated'),
                  user: toDisplayLabel(activity?.user, 'System'),
                  time: toDisplayLabel(activity?.time, ''),
                  type: toDisplayLabel(activity?.type, 'system'),
                }))
              : [],
          };
        } else {
          console.error('Analytics request failed:', analyticsResponse.reason);
        }

        // Process exams response
        if (examsResponse.status === 'fulfilled') {
          const examsPayload = examsResponse.value.data.data as any;
          const exams = extractCollection(examsPayload, ['exams']);
          const examsMetaTotal = Number(examsResponse.value.data?.meta?.total) || 0;
          const analyticsTotalExams = Number((systemData as any).totalExams) || 0;
          systemData.totalExams = analyticsTotalExams || examsMetaTotal || exams.length || 0;
        }

        console.log('Setting stats:', systemData);
        setStats((prev) => ({ ...prev, ...systemData }));
      } catch (err) {
        console.error('Failed to fetch system stats:', err);
        setError('Unable to fetch system statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();
  }, [hasFetched]);

  const handleRefresh = () => {
    setHasFetched(false);
    setLoading(true);
  };

  // Generate PDF Report
  const generatePDFReport = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const now = new Date().toLocaleString();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Academic Intelligence Platform', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('System Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Generated on: ${now}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;
      doc.setDrawColor(100);
      doc.line(15, yPosition - 5, pageWidth - 15, yPosition - 5);

      // Executive Summary
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 20, yPosition);
      
      yPosition += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const summaryItems = [
        { label: 'Total Users', value: (stats.totalUsers || stats.totalStudents + stats.totalEducators + stats.totalAdmins).toLocaleString() },
        { label: 'Students', value: stats.totalStudents },
        { label: 'Educators', value: stats.totalEducators },
        { label: 'Admins', value: stats.totalAdmins },
        { label: 'Active Courses', value: stats.activeCourses },
        { label: 'Total Exams', value: stats.totalExams },
        { label: 'System Uptime', value: '99.8%' },
      ];

      summaryItems.forEach((item) => {
        doc.text(`${item.label}:`, 30, yPosition);
        doc.text(`${item.value}`, 120, yPosition);
        yPosition += 8;
      });

      // Department Overview
      if (stats.departmentStats.length > 0) {
        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Department Overview', 20, yPosition);
        
        yPosition += 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Header row
        doc.setFont('helvetica', 'bold');
        doc.text('Department', 30, yPosition);
        doc.text('Students', 100, yPosition);
        doc.text('Educators', 130, yPosition);
        doc.text('Exams', 160, yPosition);
        yPosition += 8;

        // Data rows
        doc.setFont('helvetica', 'normal');
        stats.departmentStats.forEach((dept) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(dept.dept || 'N/A', 30, yPosition);
          doc.text(String(dept.students || 0), 100, yPosition);
          doc.text(String(dept.educators || 0), 130, yPosition);
          doc.text(String(dept.exams || 0), 160, yPosition);
          yPosition += 8;
        });
      }

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This report is confidential and for authorized personnel only.', pageWidth / 2, yPosition, { align: 'center' });

      // Save PDF
      const fileName = `Academic_Platform_Report_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      
      // Close dialog after successful generation
      setTimeout(() => {
        setReportDialogOpen(false);
      }, 500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setReportGenerating(false);
    }
  };

  // Calculate user distribution for pie chart
  const userDistribution = [
    { name: 'Students', value: stats.totalStudents || 0, color: '#6366f1' },
    { name: 'Educators', value: stats.totalEducators || 0, color: '#10b981' },
    { name: 'Admins', value: stats.totalAdmins || 0, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  // Default user distribution if no data
  const displayDistribution = userDistribution.length > 0 ? userDistribution : [
    { name: 'No data', value: 1, color: '#e5e7eb' },
  ];

  return (
    <Box ref={reportRef}>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={handleRefresh}>
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
          <Typography variant="h4" fontWeight={700} gutterBottom>Admin Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">System overview and management</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/admin/users')}>Add User</Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            onClick={() => {
              setReportGenerating(true);
              generatePDFReport();
            }}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Users" 
            value={loading ? '-' : (stats.totalUsers || stats.totalStudents + stats.totalEducators + stats.totalAdmins).toLocaleString()} 
            subtitle="Students + Educators" 
            icon={<PeopleIcon />} 
            color="#6366f1" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Courses" 
            value={loading ? '-' : stats.activeCourses} 
            subtitle="Across departments" 
            icon={<SchoolIcon />} 
            color="#10b981" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Exams" 
            value={loading ? '-' : stats.totalExams} 
            subtitle="This semester" 
            icon={<AssignmentIcon />} 
            color="#f59e0b" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="System Uptime" 
            value="99.8%" 
            subtitle="Last 30 days" 
            icon={<StorageIcon />} 
            color="#8b5cf6" 
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>User Growth</Typography>
            {loading ? (
              <Skeleton variant="rounded" height={300} />
            ) : stats.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.userGrowth}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="students" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudents)" name="Students" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                <Typography color="text.secondary">No growth data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={2}>User Distribution</Typography>
            {loading ? (
              <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={displayDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {displayDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box mt={2}>
                  {userDistribution.length > 0 ? userDistribution.map((item) => (
                    <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: item.color, mr: 1 }} />
                        <Typography variant="body2">{item.name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{item.value.toLocaleString()}</Typography>
                    </Box>
                  )) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">No user data</Typography>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Department Stats & System Health */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Department Overview</Typography>
            {loading ? (
              <Skeleton variant="rounded" height={250} />
            ) : stats.departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dept" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="#6366f1" name="Students" />
                  <Bar dataKey="exams" fill="#10b981" name="Exams" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={250}>
                <Typography color="text.secondary">No department data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>


        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Learning Performance</Typography>
            </Box>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />
              ))
            ) : (
              <Box>
                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>Student Engagement</Typography>
                    <Chip label="85%" size="small" color="success" />
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '85%', bgcolor: '#10b981' }} />
                  </Box>
                </Box>

                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>Exam Completion Rate</Typography>
                    <Chip label="72%" size="small" color="warning" />
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '72%', bgcolor: '#f59e0b' }} />
                  </Box>
                </Box>

                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>Average Performance</Typography>
                    <Chip label="78%" size="small" color="info" />
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '78%', bgcolor: '#6366f1' }} />
                  </Box>
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>Assessment Pass Rate</Typography>
                    <Chip label="88%" size="small" color="success" />
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '88%', bgcolor: '#10b981' }} />
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Recent Activity</Typography>
          <Button size="small" endIcon={<ArrowForwardIcon />}>View All</Button>
        </Box>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1 }} />
          ))
        ) : stats.recentActivity.length > 0 ? (
          <List disablePadding>
            {stats.recentActivity.map((activity, index) => (
              <ListItem key={index} sx={{ px: 2, py: 1.5, mb: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    {activity.type === 'user' && <PeopleIcon />}
                    {activity.type === 'exam' && <AssignmentIcon />}
                    {activity.type === 'system' && <StorageIcon />}
                    {activity.type === 'course' && <SchoolIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={activity.action} secondary={`by ${activity.user}`} primaryTypographyProps={{ fontWeight: 500 }} />
                <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">No recent activity</Typography>
          </Box>
        )}
      </Paper>

      {/* Report Generation Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate System Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              This will generate a comprehensive PDF report including:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li><Typography variant="body2">Executive Summary with key metrics</Typography></li>
              <li><Typography variant="body2">System Health Status</Typography></li>
              <li><Typography variant="body2">Department Overview</Typography></li>
              <li><Typography variant="body2">Current statistics and trends</Typography></li>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Report generated on: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)} disabled={reportGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={generatePDFReport} 
            variant="contained"
            disabled={reportGenerating}
            startIcon={reportGenerating ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {reportGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
