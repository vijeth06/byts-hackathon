/**
 * 🎓 Academic Intelligence Platform - About Page
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';


const InstitutionSettings: React.FC = () => {
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          About
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Academic Intelligence Platform
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Academic Intelligence
        </Typography>
        <Typography variant="body1" color="text.secondary">
          An intelligent academic assessment and analytics platform for educational institutions.
        </Typography>
      </Paper>
    </Box>
  );
};

export default InstitutionSettings;

