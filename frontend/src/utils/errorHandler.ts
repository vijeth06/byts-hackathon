/**
 * Issue #30, #37: Frontend Error Handler & Recovery
 * Provide specific error handling based on HTTP status codes
 */

export type ErrorCode = 
  | '400' // Bad Request
  | '401' // Unauthorized
  | '403' // Forbidden
  | '404' // Not Found
  | '409' // Conflict
  | '429' // Too Many Requests
  | '500' // Server Error
  | 'NETWORK' // Network Error
  | 'TIMEOUT'; // Request Timeout

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  recoveryAction?: () => void;
  isRecoverable: boolean;
}

export const getErrorInfo = (error: any): ErrorInfo => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please check your network connection and try again.',
        isRecoverable: true,
      };
    }
    return {
      code: 'NETWORK',
      message: 'Network error. Please check your connection and try again.',
      isRecoverable: true,
    };
  }

  const status = error.response.status.toString();
  const data = error.response.data;
  const message = data?.message || data?.error || error.message;

  switch (error.response.status) {
    case 400: // Bad Request
      return {
        code: '400',
        message: message || 'Invalid request. Please check your input.',
        isRecoverable: true,
      };

    case 401: // Unauthorized
      return {
        code: '401',
        message: 'Session expired. Please log in again.',
        isRecoverable: true,
        recoveryAction: () => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        },
      };

    case 403: // Forbidden - Access Denied
      if (data?.message?.includes('exam')) {
        return {
          code: '403',
          message: 'You do not have permission to access this exam.',
          isRecoverable: false,
        };
      }
      if (data?.message?.includes('attempt')) {
        return {
          code: '403',
          message: 'Maximum attempts reached. You cannot attempt this exam again.',
          isRecoverable: false,
        };
      }
      return {
        code: '403',
        message: 'Access denied. You do not have permission to perform this action.',
        isRecoverable: false,
      };

    case 404: // Not Found
      if (data?.message?.includes('exam')) {
        return {
          code: '404',
          message: 'Exam not found. It may have been deleted or is no longer available.',
          isRecoverable: false,
        };
      }
      return {
        code: '404',
        message: 'The requested resource was not found.',
        isRecoverable: false,
      };

    case 409: // Conflict
      if (data?.message?.includes('active attempt')) {
        return {
          code: '409',
          message: 'You have an active exam attempt. Please complete it first.',
          isRecoverable: true,
          recoveryAction: () => {
            // Redirect to active attempt
            const attemptId = data?.attemptId;
            if (attemptId) {
              window.location.href = `/exam/attempt/${attemptId}`;
            }
          },
        };
      }
      if (data?.message?.includes('modified')) {
        return {
          code: '409',
          message: 'This exam was modified by another user. Please refresh and try again.',
          isRecoverable: true,
          recoveryAction: () => {
            window.location.reload();
          },
        };
      }
      return {
        code: '409',
        message: message || 'Conflict occurred. Please refresh and try again.',
        isRecoverable: true,
      };

    case 429: // Too Many Requests - Rate Limited
      return {
        code: '429',
        message: 'Too many requests. Please wait a moment and try again.',
        isRecoverable: true,
      };

    case 500: // Server Error
    case 502: // Bad Gateway
    case 503: // Service Unavailable
      return {
        code: '500',
        message: 'Server error. Please try again later.',
        isRecoverable: true,
      };

    default:
      return {
        code: status as ErrorCode,
        message: message || 'An error occurred. Please try again.',
        isRecoverable: error.response.status < 500,
      };
  }
};

/**
 * Format error message for display to user
 */
export const formatErrorMessage = (error: any): string => {
  const errorInfo = getErrorInfo(error);
  return errorInfo.message;
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error: any): boolean => {
  const errorInfo = getErrorInfo(error);
  return errorInfo.isRecoverable;
};

/**
 * Execute recovery action if available
 */
export const executeErrorRecovery = (error: any): void => {
  const errorInfo = getErrorInfo(error);
  if (errorInfo.recoveryAction) {
    errorInfo.recoveryAction();
  }
};

/**
 * Handle specific exam-related errors
 */
export const handleExamError = (error: any): { action: 'retry' | 'navigate' | 'abort'; target?: string } => {
  const errorInfo = getErrorInfo(error);

  // Active attempt exists - redirect to it
  if (errorInfo.code === '409' && error.response?.data?.attemptId) {
    return { action: 'navigate', target: `/exam/attempt/${error.response.data.attemptId}` };
  }

  // Not assigned to exam - go back to available exams
  if (errorInfo.code === '403' || errorInfo.code === '404') {
    return { action: 'navigate', target: '/student/exams' };
  }

  // Recoverable errors - retry
  if (errorInfo.isRecoverable) {
    return { action: 'retry' };
  }

  // Non-recoverable - abort
  return { action: 'abort' };
};
