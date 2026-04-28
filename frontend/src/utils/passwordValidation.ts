/**
 * Password Validation Utilities
 * Validates password strength requirements
 */

export interface PasswordStrength {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validates password against security requirements:
 * - At least 8 characters
 * - At least 1 uppercase character
 * - At least 1 special symbol (!@#$%^&*)
 * - At least 1 number
 */
export const validatePassword = (password: string): PasswordStrength => {
  const errors: string[] = [];
  let passedChecks = 0;

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
    };
  }

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    passedChecks++;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  } else {
    passedChecks++;
  }

  // Check for special symbol
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least 1 special symbol (!@#$%^&* etc)');
  } else {
    passedChecks++;
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  } else {
    passedChecks++;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (passedChecks >= 3) {
    strength = 'medium';
  }
  if (passedChecks === 4) {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Get a user-friendly error message for password validation
 */
export const getPasswordErrorMessage = (password: string): string => {
  const validation = validatePassword(password);
  if (validation.isValid) {
    return '';
  }
  return validation.errors[0];
};

/**
 * Get all validation errors as a formatted string
 */
export const getPasswordValidationSummary = (password: string): string[] => {
  return validatePassword(password).errors;
};
