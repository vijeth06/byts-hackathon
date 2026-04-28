/**
 * Password Strength Indicator Component
 * Displays password validation requirements with visual feedback
 */

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { validatePassword } from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showDetails = true,
}) => {
  const validation = validatePassword(password);

  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'At least 1 uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'At least 1 special symbol (!@#$%^&* etc)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
    {
      label: 'At least 1 number (0-9)',
      met: /[0-9]/.test(password),
    },
  ];

  const strengthColors = {
    weak: '#ef4444',
    medium: '#f59e0b',
    strong: '#10b981',
  };

  if (!showDetails || !password) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          Password Strength:
        </Typography>
        <Chip
          label={validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
          size="small"
          sx={{
            backgroundColor: strengthColors[validation.strength],
            color: 'white',
            fontWeight: 600,
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
        Requirements:
      </Typography>

      <List disablePadding>
        {requirements.map((req) => (
          <ListItem key={req.label} dense sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {req.met ? (
                <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
              ) : (
                <CloseIcon sx={{ fontSize: 18, color: 'error.main' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={req.label}
              primaryTypographyProps={{
                variant: 'caption',
                sx: {
                  color: req.met ? 'success.main' : 'text.secondary',
                  textDecoration: req.met ? 'line-through' : 'none',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PasswordStrengthIndicator;
