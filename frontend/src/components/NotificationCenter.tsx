/**
 * 🔔 Notification Center Component
 * Displays and manages student notifications
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Drawer,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  InfoOutlined as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Feedback as FeedbackIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { notificationAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { connectRealtime, getRealtimeSocket } from '@/services/realtime';

interface Notification {
  id: string | number;
  notificationType: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  feedbackNotifications: boolean;
  assignmentNotifications: boolean;
  deadlineReminders: boolean;
  achievementNotifications: boolean;
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    feedbackNotifications: true,
    assignmentNotifications: true,
    deadlineReminders: true,
    achievementNotifications: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadPreferences();

      const socket = connectRealtime(String(user.id), user.institutionId ? String(user.institutionId) : undefined);
      socket.on('notification:new', (incoming: Notification) => {
        setNotifications((prev) => [incoming, ...prev]);
      });
    }
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      clearInterval(interval);
      const socket = getRealtimeSocket();
      socket?.off('notification:new');
    };
  }, []);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await notificationAPI.getUserNotifications(user.id, {
        limit: 50,
      });
      const responseData = response.data.data as Notification[];
      setNotifications(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const response = await notificationAPI.getPreferences(user.id);
      const responseData = response.data.data as NotificationPreferences;
      if (responseData) {
        setPreferences(responseData);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string | number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => notificationAPI.markAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.id) {
      return;
    }

    try {
      await notificationAPI.setPreferences(user.id, preferences);
      setSettingsOpen(false);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feedback_available':
        return <FeedbackIcon color="primary" />;
      case 'assignment_due':
      case 'task_submitted':
        return <AssignmentIcon color="warning" />;
      case 'grade_posted':
      case 'result_published':
      case 'exam_submitted':
        return <CheckCircleIcon color="success" />;
      case 'achievement':
      case 'achievement_unlocked':
        return <TrendingUpIcon color="success" />;
      case 'deadline_reminder':
      case 'deadline_approaching':
        return <WarningIcon color="warning" />;
      case 'exam_reminder':
        return <AssignmentIcon color="info" />;
      case 'goal_milestone':
      case 'exam_completion_milestone':
        return <TrendingUpIcon color="primary" />;
      case 'intervention_alert':
      case 'low_performance_alert':
        return <WarningIcon color="error" />;
      case 'new_enrollment':
        return <InfoIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 0) return notifications; // All
    if (activeTab === 1) return notifications.filter((n) => !n.isRead); // Unread
    if (activeTab === 2) return notifications.filter((n) => n.isRead); // Read
    return notifications;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      {/* Bell Icon */}
      <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </Badge>
      </IconButton>

      {/* Notification Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ px: 2 }}>
            <Tab label={`All (${notifications.length})`} />
            <Tab label={`Unread (${unreadCount})`} />
            <Tab label="Read" />
          </Tabs>

          <Divider />

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <Box sx={{ p: 2 }}>
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                fullWidth
              >
                Mark All as Read
              </Button>
            </Box>
          )}

          {/* Notification List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Loading notifications...
                </Typography>
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 1
                    ? 'No unread notifications'
                    : activeTab === 2
                    ? 'No read notifications'
                    : 'No notifications yet'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <ListItemIcon>{getNotificationIcon(notification.notificationType)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                              {notification.title}
                            </Typography>
                            <Chip
                              label={notification.priority}
                              size="small"
                              color={getPriorityColor(notification.priority) as any}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatTime(notification.createdAt)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Delivery Methods
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailEnabled}
                  onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushEnabled}
                  onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
                />
              }
              label="Push Notifications"
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" color="text.secondary">
              Notification Types
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.feedbackNotifications}
                  onChange={(e) => setPreferences({ ...preferences, feedbackNotifications: e.target.checked })}
                />
              }
              label="Feedback Available"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.assignmentNotifications}
                  onChange={(e) => setPreferences({ ...preferences, assignmentNotifications: e.target.checked })}
                />
              }
              label="Assignment Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.deadlineReminders}
                  onChange={(e) => setPreferences({ ...preferences, deadlineReminders: e.target.checked })}
                />
              }
              label="Deadline Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.achievementNotifications}
                  onChange={(e) => setPreferences({ ...preferences, achievementNotifications: e.target.checked })}
                />
              }
              label="Achievements"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreferences} variant="contained">
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
