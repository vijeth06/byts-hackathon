/**
 * 🎓 Academic Intelligence Platform - Auth Store
 * Zustand store for authentication state management
 * Connected to real backend API
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, UserRole, LoginCredentials, RegisterData } from '@/types';
import { authAPI, setTokens, clearTokens, getAccessToken } from '@/services/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login action - calls real backend API
        login: async (credentials: LoginCredentials): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authAPI.login(credentials.email, credentials.password);
            
            if (response.data.success && response.data.data) {
              const responseData = response.data.data as { user: any; tokens: { accessToken: string; refreshToken: string } };
              const { user, tokens } = responseData;
              
              // Store tokens
              setTokens(tokens.accessToken, tokens.refreshToken);
              
              // Map backend user to frontend User type
              const mappedUser: User = {
                id: user._id || user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role as UserRole,
                institutionId: user.institutionId,
                departmentId: user.departmentId,
                isActive: user.isActive,
                createdAt: user.createdAt,
                avatarUrl: user.avatarUrl,
              };
              
              set({
                user: mappedUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return true;
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: response.data.message || 'Login failed',
              });
              return false;
            }
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
              'Login failed. Please check your credentials.';
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
            return false;
          }
        },

        // Register action - calls real backend API
        register: async (data: RegisterData): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authAPI.register({
              email: data.email,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
            });
            
            if (response.data.success && response.data.data) {
              const responseData = response.data.data as { user: any; tokens?: { accessToken: string; refreshToken: string } };
              const { user, tokens } = responseData;
              
              // Store tokens if provided (auto-login after registration)
              if (tokens) {
                setTokens(tokens.accessToken, tokens.refreshToken);
                
                // Map backend user to frontend User type
                const mappedUser: User = {
                  id: user._id || user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role as UserRole,
                  institutionId: user.institutionId,
                  departmentId: user.departmentId,
                  isActive: user.isActive,
                  createdAt: user.createdAt,
                };
                
                set({
                  user: mappedUser,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
              } else {
                // No tokens - just mark as successful, user needs to login
                set({ isLoading: false, error: null });
              }
              return true;
            } else {
              set({
                isLoading: false,
                error: response.data.message || 'Registration failed',
              });
              return false;
            }
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
              'Registration failed. Please try again.';
            set({
              isLoading: false,
              error: errorMessage,
            });
            return false;
          }
        },

        // Logout action
        logout: async (): Promise<void> => {
          try {
            // Call logout API if we have a token
            if (getAccessToken()) {
              await authAPI.logout();
            }
          } catch (error) {
            // Ignore logout errors
          } finally {
            // Clear tokens and state
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        // Load user profile from API
        loadUser: async (): Promise<void> => {
          const token = getAccessToken();
          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          set({ isLoading: true });
          
          try {
            const response = await authAPI.getProfile();
            
            if (response.data.success && response.data.data) {
              const user = response.data.data as any;
              
              const mappedUser: User = {
                id: user._id || user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role as UserRole,
                institutionId: user.institutionId,
                departmentId: user.departmentId,
                isActive: user.isActive,
                createdAt: user.createdAt,
                avatarUrl: user.avatarUrl,
              };
              
              set({
                user: mappedUser,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (error) {
            // Token might be invalid
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        // Update profile
        updateProfile: async (data: { firstName?: string; lastName?: string }): Promise<boolean> => {
          try {
            const response = await authAPI.updateProfile(data);
            
            if (response.data.success) {
              const currentUser = get().user;
              if (currentUser) {
                set({
                  user: { ...currentUser, ...data },
                });
              }
              return true;
            }
            return false;
          } catch (error) {
            return false;
          }
        },

        // Change password
        changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
          try {
            const response = await authAPI.changePassword(currentPassword, newPassword);
            return response.data.success;
          } catch (error) {
            return false;
          }
        },

        // Forgot password
        forgotPassword: async (email: string): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authAPI.requestPasswordReset(email);
            set({ isLoading: false });
            return response.data.success;
          } catch (error: any) {
            set({ 
              isLoading: false,
              error: error.response?.data?.message || 'Failed to send reset email',
            });
            return false;
          }
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Set loading
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectUserRole = (state: AuthState): UserRole | null => state.user?.role || null;

// Helper hooks
export const useUser = () => useAuthStore(selectUser);
export const useIsAuthenticated = () => useAuthStore(selectIsAuthenticated);
export const useUserRole = () => useAuthStore(selectUserRole);
