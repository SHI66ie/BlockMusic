// Email Authentication Service for BlockMusic
// This service handles email-based authentication with the backend

interface EmailUser {
  _id: string;
  displayName: string;
  email: string;
  role: string;
  photo?: string;
  emailVerified: boolean;
  walletAddress?: string;
}

interface EmailAuthResponse {
  success: boolean;
  user?: EmailUser;
  token?: string;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

class EmailAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
  }

  // Sign up with email and password
  async signup(credentials: SignupCredentials): Promise<EmailAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        }

        // Emit success event
        window.dispatchEvent(new CustomEvent('emailAuthSuccess', { 
          detail: { user: data.data.user, token: data.token } 
        }));

        return {
          success: true,
          user: data.data.user,
          token: data.token,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Signup failed'
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<EmailAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        }

        // Emit success event
        window.dispatchEvent(new CustomEvent('emailAuthSuccess', { 
          detail: { user: data.data.user, token: data.token } 
        }));

        return {
          success: true,
          user: data.data.user,
          token: data.token,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Link Google account to existing email account
  async linkGoogleAccount(googleData: any): Promise<EmailAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(googleData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data
        if (data.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        }

        return {
          success: true,
          user: data.data.user,
          message: 'Google account linked successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to link Google account'
        };
      }
    } catch (error) {
      console.error('Link Google account error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Get current user profile
  async getProfile(): Promise<EmailAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data
        if (data.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        }

        return {
          success: true,
          user: data.data.user
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get profile'
        };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<EmailUser>): Promise<EmailAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        // Update stored user data
        if (data.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        }

        return {
          success: true,
          user: data.data.user,
          message: 'Profile updated successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to update profile'
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Emit logout event
      window.dispatchEvent(new CustomEvent('emailAuthSignOut'));
    }
  }

  // Get current user from local storage
  getCurrentUser(): EmailUser | null {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token') && !!this.getCurrentUser();
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Clear all auth data
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new CustomEvent('emailAuthSignOut'));
  }
}

// Export singleton instance
export const emailAuth = new EmailAuthService();

// Export types
export type { EmailUser, EmailAuthResponse, LoginCredentials, SignupCredentials };
