/**
 * 🎯 Learning Gaps View Component
 * Displays AI-detected learning gaps and prerequisite knowledge issues
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  MenuBook as MenuBookIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyticsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface LearningGap {
  conceptName: string;
  chapterName: string;
  severity: string;
  gapType: string;
  description: string;
  prerequisiteConcepts: string[];
  recommendedActions: string[];
  estimatedRecoveryTime: number;
  impactScore: number;
}

interface LearningGapsData {
  gaps: LearningGap[];
  totalGaps: number;
  criticalGaps: number;
  averageSeverity: string;
  recommendedStudyPath: string[];
}

interface LearningGapsViewProps {
  studentId?: number | string;
  courseId?: number | string;
}

const LearningGapsView: React.FC<LearningGapsViewProps> = ({ studentId, courseId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const actualStudentId = studentId || user?.id;

  const normalizeSeverity = (value: unknown): string => {
    const raw = String(value || '').toLowerCase();
    if (['critical', 'high', 'medium', 'low'].includes(raw)) return raw;
    return 'medium';
  };

  const normalizeGapsData = (rawData: any): LearningGapsData => {
    const rawGaps = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.gaps)
        ? rawData.gaps
        : Array.isArray(rawData?.learningGaps)
          ? rawData.learningGaps
          : [];

    const normalizedGaps: LearningGap[] = rawGaps.map((gap: any) => {
      const severityFromAccuracy = typeof gap?.accuracy === 'number'
        ? (gap.accuracy < 40 ? 'high' : gap.accuracy < 60 ? 'medium' : 'low')
        : 'medium';

      const rawImpact = Number(
        gap?.impactScore ??
        gap?.impact_score ??
        (typeof gap?.accuracy === 'number' ? (100 - gap.accuracy) : 0)
      );
      const normalizedImpact = rawImpact > 1 ? rawImpact / 100 : rawImpact;

      return {
        conceptName: gap?.conceptName || gap?.concept || gap?.topic || 'Unknown Topic',
        chapterName: gap?.chapterName || gap?.chapter || 'General',
        severity: normalizeSeverity(gap?.severity || severityFromAccuracy),
        gapType: gap?.gapType || 'performance_gap',
        description: gap?.description || gap?.recommendation || 'Needs additional practice.',
        prerequisiteConcepts: Array.isArray(gap?.prerequisiteConcepts) ? gap.prerequisiteConcepts : [],
        recommendedActions: Array.isArray(gap?.recommendedActions)
          ? gap.recommendedActions
          : (gap?.recommendation ? [gap.recommendation] : ['Review chapter notes and reattempt practice questions.']),
        estimatedRecoveryTime: Number(gap?.estimatedRecoveryTime || gap?.estimatedTime || 7),
        impactScore: Math.max(0, Math.min(1, normalizedImpact)),
      };
    });

    const criticalCount = normalizedGaps.filter((g) => g.severity === 'critical' || g.severity === 'high').length;

    return {
      gaps: normalizedGaps,
      totalGaps: Number(rawData?.totalGaps || rawData?.total_gaps || normalizedGaps.length),
      criticalGaps: Number(rawData?.criticalGaps || rawData?.critical_gaps || criticalCount),
      averageSeverity: String(rawData?.averageSeverity || rawData?.average_severity || (criticalCount > 0 ? 'high' : 'medium')),
      recommendedStudyPath: Array.isArray(rawData?.recommendedStudyPath)
        ? rawData.recommendedStudyPath
        : Array.isArray(rawData?.recommended_study_path)
          ? rawData.recommended_study_path
          : [],
    };
  };
  
  const [gapsData, setGapsData] = useState<LearningGapsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGaps();
  }, [actualStudentId, courseId]);

  const loadGaps = async () => {
    if (!actualStudentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = courseId
        ? await analyticsAPI.getLearningGaps(actualStudentId, courseId)
        : await analyticsAPI.getMyLearningGaps();

      setGapsData(normalizeGapsData(response.data.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load learning gaps');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      case 'low':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getDefaultTargetDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleStartStudyPlan = () => {
    const planPreview = (gapsData?.recommendedStudyPath || []).slice(0, 3).join(' -> ');
    const prefill = {
      goalType: 'concept_mastery',
      targetMetric: 'concept_accuracy',
      targetValue: 85,
      targetDate: getDefaultTargetDate(),
      priority: (gapsData?.criticalGaps || 0) > 0 ? 'high' : 'medium',
      description: planPreview
        ? `Follow study path: ${planPreview}`
        : 'Follow my personalized study plan to close learning gaps.',
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

  if (!gapsData || !gapsData.gaps || gapsData.gaps.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Learning Gaps Detected! 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your knowledge foundation is solid. Keep up the great work!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PsychologyIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{gapsData?.totalGaps || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Gaps
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{gapsData?.criticalGaps || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Gaps
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimelineIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
                    {gapsData?.averageSeverity || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Severity
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alert */}
      {(gapsData?.criticalGaps || 0) > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="subtitle2" gutterBottom>
            Action Required: {gapsData.criticalGaps} Critical Gap{gapsData.criticalGaps > 1 ? 's' : ''} Detected
          </Typography>
          <Typography variant="body2">
            These knowledge gaps need immediate attention to prevent further learning difficulties.
          </Typography>
        </Alert>
      )}

      {/* Learning Gaps List */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingDownIcon />
        Identified Learning Gaps
      </Typography>

      {gapsData?.gaps?.map((gap, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            {/* Gap Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getSeverityIcon(gap.severity)}
                  <Typography variant="h6">{gap.conceptName}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Chapter: {gap.chapterName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                <Chip
                  label={gap.severity}
                  color={getSeverityColor(gap.severity) as any}
                  size="small"
                />
                <Chip
                  label={gap.gapType}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body2" sx={{ mb: 2 }}>
              {gap.description}
            </Typography>

            {/* Impact Score */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Impact on Learning Progress
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {(gap.impactScore * 100).toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={gap.impactScore * 100}
                color={gap.impactScore > 0.7 ? 'error' : gap.impactScore > 0.4 ? 'warning' : 'info'}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>

            {/* Prerequisites */}
            {gap.prerequisiteConcepts && gap.prerequisiteConcepts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBookIcon fontSize="small" />
                  Missing Prerequisites
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {gap.prerequisiteConcepts.map((prereq, i) => (
                    <Chip key={i} label={prereq} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Recommended Actions */}
            {gap.recommendedActions && gap.recommendedActions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommended Actions:
                </Typography>
                <List dense>
                  {gap.recommendedActions.map((action, i) => (
                    <ListItem key={i} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <PlayArrowIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Recovery Time */}
            <Paper sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                Estimated Recovery Time:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {gap.estimatedRecoveryTime} days with focused study
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      ))}

      {/* Recommended Study Path */}
      {gapsData?.recommendedStudyPath && gapsData.recommendedStudyPath.length > 0 && (
        <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon />
              Your Personalized Study Path
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Follow this AI-recommended sequence to efficiently fill your knowledge gaps:
            </Typography>
            <List>
              {gapsData.recommendedStudyPath.map((step, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'white',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={step}
                    sx={{ color: 'white' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={loadGaps}>
          Refresh Analysis
        </Button>
        <Button
          variant="contained"
          startIcon={<MenuBookIcon />}
          onClick={handleStartStudyPlan}
        >
          Start Study Plan
        </Button>
      </Box>
    </Box>
  );
};

export default LearningGapsView;
