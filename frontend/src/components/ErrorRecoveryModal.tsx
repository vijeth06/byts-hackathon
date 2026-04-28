/**
 * 🎓 Academic Intelligence Platform - Error Recovery Modal
 * Provides contextual error recovery options for exam-related errors
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

interface ErrorRecoveryModalProps {
  open: boolean;
  errorCode?: number;
  errorMessage: string;
  title?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onClose?: () => void;
  isRetrying?: boolean;
  recoveryActions?: {
    name: string;
    action: () => void;
    icon?: React.ReactNode;
  }[];
}

const ErrorRecoveryModal: React.FC<ErrorRecoveryModalProps> = ({
  open,
  errorCode,
  errorMessage,
  title,
  onRetry,
  onGoHome,
  onClose,
  isRetrying = false,
  recoveryActions = [],
}) => {
  // Determine error severity and icon
  const getSeverityColor = () => {
    if (!errorCode) return 'error';
    if (errorCode >= 500) return 'error';
    if (errorCode === 429) return 'warning';
    if (errorCode === 403 || errorCode === 404) return 'warning';
    return 'error';
  };

  // Get context-specific recovery suggestions
  const getRecoverySuggestions = () => {
    if (!errorCode) return [];

    const suggestions: { [key: number]: string[] } = {
      401: [
        'Your session has expired. Please log in again.',
        'If you were in the middle of an exam, your progress has been saved.',
      ],
      403: [
        'You may not have permission to access this exam.',
        'Contact your instructor to request access.',
      ],
      404: [
        'The exam or attempt was not found.',
        'The exam may have been deleted or completed.',
      ],
      409: [
        'There is already an active attempt for this exam.',
        'Please resume your existing attempt or wait for it to expire.',
      ],
      429: [
        'Too many requests. Please wait a moment before trying again.',
        'The system is preventing spam attempts.',
      ],
      500: [
        'A server error occurred. This has been logged for our team.',
        'Please try again in a few moments.',
      ],
    };

    return suggestions[errorCode] || [
      'An unexpected error occurred while loading the exam.',
      'Please try refreshing the page or contact support.',
    ];
  };

  const defaultRecoveryActions = recoveryActions.length > 0 
    ? recoveryActions
    : [
        ...(onRetry ? [
          {
            name: 'Try Again',
            action: onRetry,
            icon: <RefreshIcon />,
          }
        ] : []),
        ...(onGoHome ? [
          {
            name: 'Go to Exams',
            action: onGoHome,
            icon: <HomeIcon />,
          }
        ] : []),
        {
          name: 'Contact Support',
          action: () => {
            window.location.href = 'mailto:support@platform.com';
          },
          icon: <SupportIcon />,
        },
      ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorIcon color="error" />
        {title || 'Exam Error'}
        {errorCode && (
          <Typography
            component="span"
            sx={{ ml: 'auto', fontSize: '0.875rem', color: 'text.secondary' }}
          >
            Error {errorCode}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2}>
          {/* Main Error Message */}
          <Alert 
            severity={getSeverityColor() as any}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {errorMessage}
            </Typography>
          </Alert>

          {/* Recovery Suggestions */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              What you can do:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {getRecoverySuggestions().map((suggestion, idx) => (
                <li key={idx}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {suggestion}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>

          {/* Additional Info for 401 */}
          {errorCode === 401 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                If you were taking an exam, don't worry! Your answers will be saved and you can resume later.
              </Typography>
            </Alert>
          )}

          {/* Additional Info for 429 */}
          {errorCode === 429 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                The system is throttling requests. Please wait a few seconds before retrying.
              </Typography>
            </Alert>
          )}

          {/* Additional Info for 409 */}
          {errorCode === 409 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You have an active exam attempt in progress. Resume it or wait for the time to expire.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {onClose && (
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
        )}

        {defaultRecoveryActions.map((action, idx) => (
          <Button
            key={idx}
            onClick={() => {
              action.action();
              onClose?.();
            }}
            variant={idx === 0 ? 'contained' : 'outlined'}
            startIcon={action.icon}
            disabled={isRetrying}
            sx={{ position: 'relative' }}
          >
            {action.name}
            {isRetrying && idx === 0 && (
              <CircularProgress
                size={20}
                sx={{
                  position: 'absolute',
                  right: 16,
                }}
              />
            )}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default ErrorRecoveryModal;
