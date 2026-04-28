/**
 * 🎓 Academic Intelligence Platform - Error Boundary
 * Catches React component errors and provides recovery UI
 */

import React, { ReactNode } from 'react';
import { Box, Paper, Typography, Button, Stack, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  reset: () => void;
}> = ({ error, reset }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: 500,
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {/* Error Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
        </Box>

        {/* Error Title */}
        <Typography
          variant="h5"
          component="h1"
          sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}
        >
          Oops! Something went wrong
        </Typography>

        {/* Error Details */}
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {error.message || 'An unexpected error occurred'}
          </Typography>
        </Alert>

        {/* Error Stack (Development only) */}
        {import.meta.env.DEV && (
          <Box
            sx={{
              bgcolor: 'grey.200',
              p: 1.5,
              borderRadius: 1,
              mb: 2,
              maxHeight: 150,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.stack}
          </Box>
        )}

        {/* Recovery Messages */}
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          The application encountered an error and may have lost some state. 
          Try reloading the page or going back to the home screen.
        </Typography>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={reset}
            fullWidth
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            fullWidth
          >
            Go Home
          </Button>
        </Stack>

        {/* Additional Help */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          If the problem persists, please contact support at{' '}
          <a href="mailto:support@platform.com" style={{ color: 'inherit', textDecoration: 'underline' }}>
            support@platform.com
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ErrorBoundary;
export type { ErrorBoundaryProps };
