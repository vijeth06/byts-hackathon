/**
 * 🎓 Academic Intelligence Platform - Auth Layout
 */

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'educator':
        return <Navigate to="/educator" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: '300px', md: '600px' },
          height: { xs: '300px', md: '600px' },
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: { xs: '-100px', md: '-200px' },
          right: { xs: '-100px', md: '-200px' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: '200px', md: '400px' },
          height: { xs: '200px', md: '400px' },
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          bottom: { xs: '-50px', md: '-100px' },
          left: { xs: '-50px', md: '-100px' },
        }}
      />

      {/* Left side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          color: 'white',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 4,
          }}
        >
          <SchoolIcon sx={{ fontSize: 64 }} />
          <Typography variant="h2" fontWeight={700}>
            Academic Intelligence
          </Typography>
        </Box>
        <Typography
          variant="h5"
          sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 500 }}
        >
          Transform exam data into actionable academic intelligence
        </Typography>
        <Box sx={{ mt: 6 }}>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
            ✓ Chapter-wise performance analysis
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
            ✓ Concept mastery tracking
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
            ✓ Learning gap detection
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
            ✓ Personalized feedback & recommendations
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            ✓ Predictive trend analysis
          </Typography>
        </Box>
      </Box>

      {/* Right side - Auth forms */}
      <Box
        sx={{
          flex: { xs: 1, lg: 0.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              p: { xs: 2.5, sm: 4, md: 5 },
              borderRadius: { xs: 3, sm: 4 },
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Mobile branding */}
            <Box
              sx={{
                display: { xs: 'flex', lg: 'none' },
                flexDirection: 'column',
                alignItems: 'center',
                mb: { xs: 3, sm: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mb: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <SchoolIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main' }} />
                <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} color="primary" textAlign="center">
                  Academic Intelligence
                </Typography>
              </Box>
            </Box>

            {/* Auth form content */}
            <Outlet />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;
