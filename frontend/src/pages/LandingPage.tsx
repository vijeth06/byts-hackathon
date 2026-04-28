/**
 * 🎓 Academic Intelligence Platform - Landing Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import {
  School as SchoolIcon,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 8 }, mb: { xs: 4, md: 8 }, px: { xs: 2, sm: 3 } }}>
        {/* Institute Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
          <SchoolIcon sx={{ fontSize: 88, color: '#2563eb' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Academic Intelligence
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
              Kongu Engineering College
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            gap: { xs: 4, lg: 8 },
            position: 'relative',
          }}
        >
          {/* Left Side - Content */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', lg: 600 }, mt: { xs: 0, lg: -8 }, textAlign: { xs: 'center', lg: 'left' } }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 800,
                lineHeight: 1.1,
                mb: 3,
                color: '#1e293b',
              }}
            >
              The Smarter Way to Learn{' '}
              <Box component="span" sx={{ color: '#2563eb' }}>
                Anything
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: '#64748b',
                mb: 4,
                lineHeight: 1.8,
              }}
            >
              A reliable academic platform built for learning, practice, and assessment.
            </Typography>

            {/* CTA Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', lg: 'flex-start' }, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  px: { xs: 3, md: 4 },
                  py: 1.5,
                  borderRadius: 50,
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  px: { xs: 3, md: 4 },
                  py: 1.5,
                  borderRadius: 50,
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 600,
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#1d4ed8',
                    background: 'rgba(37, 99, 235, 0.05)',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>

          {/* Right Side - Student Images with Orange Circles */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              height: { xs: 300, md: 400, lg: 600 },
              width: '100%',
              display: { xs: 'none', md: 'block' },
            }}
          >
            {/* Large Blue Circle */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: { xs: 20, lg: 80 },
                width: { xs: 120, md: 150, lg: 200 },
                height: { xs: 120, md: 150, lg: 200 },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                zIndex: 1,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-20px)' },
                },
              }}
            />

            {/* Small Blue Circle */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 60, lg: 120 },
                right: { xs: 200, lg: 380 },
                width: { xs: 50, lg: 80 },
                height: { xs: 50, lg: 80 },
                borderRadius: '50%',
                background: '#60a5fa',
                zIndex: 1,
                animation: 'float 2.5s ease-in-out infinite',
              }}
            />

            {/* Tiny Blue Circle */}
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 100, lg: 200 },
                right: { xs: 100, lg: 200 },
                width: { xs: 30, lg: 50 },
                height: { xs: 30, lg: 50 },
                borderRadius: '50%',
                background: '#2563eb',
                zIndex: 1,
                animation: 'float 2s ease-in-out infinite',
              }}
            />

            {/* Student Image 1 - Top Right */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 30, md: 40, lg: 60 },
                right: 0,
                width: { xs: 120, md: 140, lg: 180 },
                height: { xs: 120, md: 140, lg: 180 },
                borderRadius: '50%',
                overflow: 'hidden',
                border: { xs: '4px solid white', md: '6px solid white', lg: '8px solid white' },
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 2,
                animation: 'fadeIn 1s ease-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'scale(0.8)' },
                  '100%': { opacity: 1, transform: 'scale(1)' },
                },
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&q=80"
                alt="Student learning"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            {/* Student Image 2 - Middle */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 140, md: 170, lg: 220 },
                right: { xs: 100, md: 140, lg: 180 },
                width: { xs: 100, md: 120, lg: 160 },
                height: { xs: 100, md: 120, lg: 160 },
                borderRadius: '50%',
                overflow: 'hidden',
                border: { xs: '4px solid white', md: '6px solid white', lg: '8px solid white' },
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 2,
                animation: 'fadeIn 1.2s ease-out',
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&q=80"
                alt="Student studying"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            {/* Student Image 3 - Bottom Right */}
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 20, md: 40, lg: 80 },
                right: { xs: 20, md: 30, lg: 50 },
                width: { xs: 130, md: 160, lg: 200 },
                height: { xs: 130, md: 160, lg: 200 },
                borderRadius: '50%',
                overflow: 'hidden',
                border: { xs: '4px solid white', md: '6px solid white', lg: '8px solid white' },
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 2,
                animation: 'fadeIn 1.4s ease-out',
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&q=80"
                alt="Student with laptop"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            {/* Student Image 4 - Bottom Left - Hidden on medium screens */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: { md: 200, lg: 300 },
                width: { md: 80, lg: 120 },
                height: { md: 80, lg: 120 },
                borderRadius: '50%',
                overflow: 'hidden',
                border: { md: '4px solid white', lg: '8px solid white' },
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 2,
                animation: 'fadeIn 1.6s ease-out',
                display: { xs: 'none', lg: 'block' },
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=300&q=80"
                alt="Student in library"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
