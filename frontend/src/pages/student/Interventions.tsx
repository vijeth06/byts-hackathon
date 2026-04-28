/**
 * 🎓 Student Interventions Page
 * View interventions assigned by educators
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
  Tabs,
  Tab,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  SupportAgent as SupportAgentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { interventionAPI } from '@/services/api';

interface InterventionCheckin {
  id: string;
  progress: string;
  observations: string;
  nextSteps?: string;
  checkinDate: string;
}

interface Intervention {
  id: string;
  interventionType: string;
  status: string;
  reason: string;
  plannedActions: string;
  estimatedDuration?: number;
  actualStartDate?: string;
  completionDate?: string;
  outcome?: string;
  notes?: string;
  educatorName: string;
  checkins: InterventionCheckin[];
  createdAt: string;
}

const StudentInterventions: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadInterventions();
  }, []);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await interventionAPI.getMyInterventions();
      setInterventions((response.data?.data || []) as Intervention[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load interventions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'planned': return 'warning';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'active': return <PlayArrowIcon />;
      case 'planned': return <PendingIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatType = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'improved': return 'success';
      case 'on_track': return 'primary';
      case 'no_change': return 'warning';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const filtered = activeTab === 0
    ? interventions
    : activeTab === 1
      ? interventions.filter(i => i.status === 'active')
      : activeTab === 2
        ? interventions.filter(i => i.status === 'planned')
        : interventions.filter(i => i.status === 'completed');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SupportAgentIcon color="primary" />
          My Interventions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Support plans assigned by your educators to help you improve
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active', count: interventions.filter(i => i.status === 'active').length, color: 'primary.main' },
          { label: 'Planned', count: interventions.filter(i => i.status === 'planned').length, color: 'warning.main' },
          { label: 'Completed', count: interventions.filter(i => i.status === 'completed').length, color: 'success.main' },
        ].map(item => (
          <Grid item xs={12} sm={4} key={item.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: item.color }}>{item.count}</Typography>
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label={`All (${interventions.length})`} />
        <Tab label={`Active (${interventions.filter(i => i.status === 'active').length})`} />
        <Tab label={`Planned (${interventions.filter(i => i.status === 'planned').length})`} />
        <Tab label={`Completed (${interventions.filter(i => i.status === 'completed').length})`} />
      </Tabs>

      {/* Content */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SupportAgentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No Interventions</Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any interventions assigned yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((intervention) => (
            <Card key={intervention.id}>
              <CardContent>
                {/* Header row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {formatType(intervention.interventionType)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Assigned by: {intervention.educatorName}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={getStatusIcon(intervention.status)}
                    label={intervention.status}
                    size="small"
                    color={getStatusColor(intervention.status) as any}
                  />
                </Box>

                {/* Details */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Reason</Typography>
                  <Typography variant="body2" color="text.secondary">{intervention.reason}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Planned Actions</Typography>
                  <Typography variant="body2" color="text.secondary">{intervention.plannedActions}</Typography>
                </Box>

                {/* Meta info */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDate(intervention.createdAt)}
                    </Typography>
                  </Box>
                  {intervention.actualStartDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PlayArrowIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Started: {formatDate(intervention.actualStartDate)}
                      </Typography>
                    </Box>
                  )}
                  {intervention.estimatedDuration && (
                    <Typography variant="body2" color="text.secondary">
                      Duration: {intervention.estimatedDuration} days
                    </Typography>
                  )}
                </Box>

                {intervention.outcome && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Outcome</Typography>
                    <Typography variant="body2" color="text.secondary">{intervention.outcome}</Typography>
                  </Box>
                )}

                {/* Check-ins */}
                {intervention.checkins.length > 0 && (
                  <Accordion sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon fontSize="small" />
                        <Typography variant="subtitle2">
                          Check-ins ({intervention.checkins.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {intervention.checkins.map((checkin, idx) => (
                        <Box key={checkin.id}>
                          {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Chip
                              label={checkin.progress.replace(/_/g, ' ')}
                              size="small"
                              color={getProgressColor(checkin.progress) as any}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(checkin.checkinDate)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {checkin.observations}
                          </Typography>
                          {checkin.nextSteps && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              Next steps: {checkin.nextSteps}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default StudentInterventions;
