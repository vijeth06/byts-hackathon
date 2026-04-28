/**
 * 💬 Personalized Feedback Component
 * Displays AI-generated personalized feedback from Python analytics service
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TipsAndUpdates as TipsIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyticsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface FeedbackItem {
  type: string;
  priority: string;
  message: string;
  actionable: boolean;
  metadata?: any;
}

interface PersonalizedFeedbackData {
  overallFeedback: string;
  strengths: FeedbackItem[];
  weaknesses: FeedbackItem[];
  recommendations: FeedbackItem[];
  nextSteps: string[];
  estimatedImprovementTime: number;
  confidenceScore: number;
}

interface PersonalizedFeedbackProps {
  studentId?: number;
  courseId: number | string;
  examId?: number;
}

const PersonalizedFeedback: React.FC<PersonalizedFeedbackProps> = ({ studentId, courseId, examId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveStudentId = (): number | undefined => {
    if (typeof studentId === 'number') {
      return studentId;
    }

    if (typeof user?.id === 'number') {
      return user.id;
    }

    if (typeof user?.id === 'string') {
      const parsed = Number(user.id);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  };

  const actualStudentId = resolveStudentId();
  
  const [feedback, setFeedback] = useState<PersonalizedFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizePriority = (value: unknown): string => {
    const raw = String(value || '').toLowerCase();
    if (raw === 'critical') return 'high';
    if (['high', 'medium', 'low'].includes(raw)) return raw;
    return 'medium';
  };

  const mapFeedbackItems = (items: any[] | undefined, fallbackType: string): FeedbackItem[] => {
    return (Array.isArray(items) ? items : []).map((item: any) => {
      const actionItems = Array.isArray(item?.action_items)
        ? item.action_items
        : Array.isArray(item?.actionItems)
          ? item.actionItems
          : [];

      return {
        type: String(item?.feedback_type || item?.feedbackType || item?.type || fallbackType),
        priority: normalizePriority(item?.priority),
        message: String(item?.description || item?.message || item?.title || 'No feedback details available.'),
        actionable: actionItems.length > 0,
        metadata: {
          estimatedTime: item?.metadata?.estimatedTime,
          actionItems,
          resources: Array.isArray(item?.resources) ? item.resources : [],
        },
      };
    });
  };

  const normalizeFeedbackData = (rawData: any): PersonalizedFeedbackData => {
    const strengths = mapFeedbackItems(rawData?.strengths, 'strength');
    const improvements = mapFeedbackItems(rawData?.improvements, 'improvement');
    const warnings = mapFeedbackItems(rawData?.warnings, 'warning');
    const recommendations = mapFeedbackItems(rawData?.recommendations, 'recommendation');

    const nextSteps = recommendations
      .flatMap((item) => (Array.isArray(item.metadata?.actionItems) ? item.metadata.actionItems : []))
      .filter((step: unknown) => typeof step === 'string' && step.trim().length > 0)
      .slice(0, 5);

    const confidenceRaw = rawData?.confidenceScore ?? rawData?.confidence_score ?? rawData?.confidence_level;
    const normalizedConfidence = typeof confidenceRaw === 'number'
      ? (confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw)
      : 0.8;

    return {
      overallFeedback: String(rawData?.overallFeedback || rawData?.summary || 'Here is your latest personalized learning feedback.'),
      strengths,
      weaknesses: [...improvements, ...warnings],
      recommendations,
      nextSteps,
      estimatedImprovementTime: Number(rawData?.estimatedImprovementTime || rawData?.estimated_improvement_time || 0),
      confidenceScore: Math.max(0, Math.min(1, normalizedConfidence)),
    };
  };

  useEffect(() => {
    loadFeedback();
  }, [actualStudentId, courseId, examId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsAPI.getFeedback(actualStudentId, courseId, examId);
      const payload = response.data?.data;
      setFeedback(payload ? normalizeFeedbackData(payload) : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load personalized feedback');
    } finally {
      setLoading(false);
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

  const getDefaultTargetDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleCreateGoalFromFeedback = () => {
    const firstRecommendation = feedback?.recommendations?.[0]?.message;
    const firstWeakness = feedback?.weaknesses?.[0]?.message;

    const prefill = {
      goalType: 'score_improvement',
      targetMetric: 'average_score',
      targetValue: 80,
      targetDate: getDefaultTargetDate(),
      priority: 'medium',
      description: firstRecommendation || firstWeakness || 'Improve performance using personalized feedback recommendations.',
    };

    sessionStorage.setItem('aip:pending-goal-prefill', JSON.stringify(prefill));

    const isOnStudentDashboard = location.pathname === '/student' || location.pathname === '/student/dashboard';
    if (isOnStudentDashboard) {
      window.dispatchEvent(new CustomEvent('aip:create-goal', { detail: prefill }));
      return;
    }

    navigate('/student/dashboard');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width="60%" height={32} />
          </Box>
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Feedback Available Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete an exam to receive personalized AI-powered feedback
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
     <Box>
      {/* AI-Powered Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="caption" color="text.secondary">
          AI-Powered Feedback • Confidence: {Math.round((feedback.confidenceScore || 0) * 100)}%
        </Typography>
      </Box>

      {/* Overall Feedback Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PsychologyIcon sx={{ fontSize: 40, color: 'white' }} />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              Personalized Insights
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'white', opacity: 0.95 }}>
            {feedback.overallFeedback}
          </Typography>
          {feedback.estimatedImprovementTime && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'white' }} />
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                Estimated improvement time: {feedback.estimatedImprovementTime} days with consistent practice
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Strengths Section */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <StarIcon color="success" />
              <Typography variant="h6">Your Strengths</Typography>
              <Chip label={feedback.strengths.length} size="small" color="success" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {feedback.strengths.map((item, index) => (
                <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.message}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Chip
                        label={item.priority}
                        size="small"
                        color={getPriorityColor(item.priority) as any}
                        sx={{ mt: 1 }}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Weaknesses Section */}
      {feedback.weaknesses && feedback.weaknesses.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <ErrorIcon color="error" />
              <Typography variant="h6">Areas for Improvement</Typography>
              <Chip label={feedback.weaknesses.length} size="small" color="error" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {feedback.weaknesses.map((item, index) => (
                <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.message}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={item.priority}
                          size="small"
                          color={getPriorityColor(item.priority) as any}
                        />
                        {item.actionable && (
                          <Chip
                            label="Actionable"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Recommendations Section */}
      {feedback.recommendations && feedback.recommendations.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <TipsIcon color="primary" />
              <Typography variant="h6">Smart Recommendations</Typography>
              <Chip label={feedback.recommendations.length} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {feedback.recommendations.map((item, index) => (
                <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon>
                    <MenuBookIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.message}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={item.priority}
                          size="small"
                          color={getPriorityColor(item.priority) as any}
                        />
                        {item.metadata?.estimatedTime && (
                          <Chip
                            label={`${item.metadata.estimatedTime} min`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Next Steps Section */}
      {feedback.nextSteps && feedback.nextSteps.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6">Next Steps</Typography>
            </Box>
            <List>
              {feedback.nextSteps.map((step, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={loadFeedback}>
          Refresh Feedback
        </Button>
        <Button variant="contained" startIcon={<TrendingUpIcon />} onClick={handleCreateGoalFromFeedback}>
          Create Goal from Feedback
        </Button>
      </Box>
    </Box>
  );
};

export default PersonalizedFeedback;
