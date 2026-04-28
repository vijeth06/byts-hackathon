/**
 * 🎓 Academic Intelligence Platform - Chapter/Concept Management
 * Educator interface to manage chapters and concepts for subjects
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { subjectAPI, chapterAPI } from '@/services/api';

const ChapterConceptManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<Record<string, any[]>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [conceptDialogOpen, setConceptDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>('');

  const [chapterForm, setChapterForm] = useState({
    name: '',
    chapterNumber: 1,
    description: '',
  });

  const [conceptForm, setConceptForm] = useState({
    name: '',
    description: '',
    difficultyLevel: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters();
    } else {
      setChapters([]);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await subjectAPI.getSubjects({ limit: 100 });
      const data = response.data.data as { subjects?: any[] } | any[];
      const subjectsList = Array.isArray(data) ? data : (data?.subjects || []);
      setSubjects(subjectsList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!selectedSubject) return;
    try {
      const response = await subjectAPI.getChaptersBySubject(selectedSubject);
      const data = response.data.data as { chapters?: any[] } | any[];
      const chaptersList = Array.isArray(data) ? data : (data?.chapters || []);
      setChapters(chaptersList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch chapters');
    }
  };

  const fetchConcepts = async (chapterId: string) => {
    try {
      const response = await chapterAPI.getConceptsByChapter(chapterId);
      const data = response.data.data as { concepts?: any[] } | any[];
      const conceptsList = Array.isArray(data) ? data : (data?.concepts || []);
      setConcepts({ ...concepts, [chapterId]: conceptsList });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch concepts');
    }
  };

  const handleChapterExpand = (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
      if (!concepts[chapterId]) {
        fetchConcepts(chapterId);
      }
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedSubject) return;
    try {
      await subjectAPI.createChapter(selectedSubject, chapterForm);
      setSuccess('Chapter created successfully');
      setChapterDialogOpen(false);
      resetChapterForm();
      fetchChapters();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chapter');
    }
  };

  const handleCreateConcept = async () => {
    if (!selectedChapter) return;
    try {
      await chapterAPI.createConcept(selectedChapter, conceptForm);
      setSuccess('Concept created successfully');
      setConceptDialogOpen(false);
      resetConceptForm();
      fetchConcepts(selectedChapter);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create concept');
    }
  };

  const resetChapterForm = () => {
    setChapterForm({ name: '', chapterNumber: 1, description: '' });
  };

  const resetConceptForm = () => {
    setConceptForm({ name: '', description: '', difficultyLevel: 'medium' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Chapter & Concept Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your curriculum with structured chapters and concepts
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Subject Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Select Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setChapterDialogOpen(true)}
              disabled={!selectedSubject}
            >
              Add Chapter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Chapters List */}
      {selectedSubject && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <BookIcon /> Chapters ({chapters.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {chapters.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No chapters yet. Create your first chapter to get started.
              </Typography>
            </Box>
          ) : (
            <List>
              {chapters.map((chapter) => (
                <Box key={chapter.id}>
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip label={`Ch ${chapter.chapterNumber}`} size="small" color="primary" />
                          <Typography variant="subtitle1">{chapter.name}</Typography>
                        </Box>
                      }
                      secondary={chapter.description || 'No description'}
                    />
                    <Box display="flex" gap={1}>
                      <Chip
                        label={`${chapter.conceptCount || 0} concepts`}
                        size="small"
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedChapter(chapter.id);
                          setConceptDialogOpen(true);
                        }}
                      >
                        Add Concept
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleChapterExpand(chapter.id)}
                      >
                        {expandedChapter === chapter.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </ListItem>

                  <Collapse in={expandedChapter === chapter.id}>
                    <Box pl={4} pr={2} pb={2}>
                      {concepts[chapter.id]?.length > 0 ? (
                        <List>
                          {concepts[chapter.id].map((concept) => (
                            <ListItem
                              key={concept.id}
                              sx={{
                                border: '1px dashed',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: 'background.default',
                              }}
                            >
                              <ListItemText
                                primary={concept.name}
                                secondary={concept.description || 'No description'}
                              />
                              {concept.difficultyLevel && (
                                <Chip
                                  label={concept.difficultyLevel}
                                  size="small"
                                  color={
                                    concept.difficultyLevel === 'easy'
                                      ? 'success'
                                      : concept.difficultyLevel === 'hard'
                                      ? 'error'
                                      : 'warning'
                                  }
                                />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No concepts yet. Add concepts to organize this chapter.
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Create Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onClose={() => setChapterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Chapter</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Chapter Number"
                value={chapterForm.chapterNumber}
                onChange={(e) => setChapterForm({ ...chapterForm, chapterNumber: Number(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Chapter Name"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChapterDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateChapter}
            disabled={!chapterForm.name || !chapterForm.chapterNumber}
          >
            Create Chapter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Concept Dialog */}
      <Dialog open={conceptDialogOpen} onClose={() => setConceptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Concept</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Concept Name"
                value={conceptForm.name}
                onChange={(e) => setConceptForm({ ...conceptForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={conceptForm.description}
                onChange={(e) => setConceptForm({ ...conceptForm, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level (Optional)</InputLabel>
                <Select
                  value={conceptForm.difficultyLevel}
                  label="Difficulty Level (Optional)"
                  onChange={(e) =>
                    setConceptForm({
                      ...conceptForm,
                      difficultyLevel: e.target.value as 'easy' | 'medium' | 'hard' | 'expert',
                    })
                  }
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConceptDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateConcept}
            disabled={!conceptForm.name}
          >
            Create Concept
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChapterConceptManagement;
