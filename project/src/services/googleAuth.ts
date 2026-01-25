// Google OAuth Service for BlockMusic
// This service handles Google authentication using Google's OAuth 2.0 flow

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleAuthResponse {
  success: boolean;
  user?: GoogleUser;
  token?: string;
  error?: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    // These would normally come from environment variables
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
    this.redirectUri = `${window.location.origin}/auth/google/callback`;
    this.scope = 'openid email profile';
  }

  // Initialize Google OAuth
  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services library
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Initialize Google Identity Services
        (window as any).google?.accounts?.id?.initialize({
          client_id: this.clientId,
          callback: this.handleGoogleResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Render Google Sign-In button
  renderButton(elementId: string, onClick?: () => void): void {
    (window as any).google?.accounts?.id?.renderButton(
      document.getElementById(elementId),
      {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
      }
    );

    // Add custom click handler if provided
    if (onClick) {
      const button = document.getElementById(elementId)?.querySelector('div[role="button"]');
      if (button) {
        button.addEventListener('click', onClick);
      }
    }
  }

  // Sign in with Google using popup
  async signIn(): Promise<GoogleAuthResponse> {
    try {
      return new Promise((resolve, reject) => {
        (window as any).google?.accounts?.oauth2?.initTokenClient({
          client_id: this.clientId,
          scope: this.scope,
          callback: (response: any) => {
            if (response.error) {
              resolve({
                success: false,
                error: response.error_description || 'Google sign-in failed'
              });
            } else {
              this.getUserInfo(response.access_token)
                .then(user => {
                  resolve({
                    success: true,
                    user,
                    token: response.access_token
                  });
                })
                .catch(error => {
                  resolve({
                    success: false,
                    error: error.message || 'Failed to get user info'
                  });
                });
            }
          },
        }).requestAccessToken();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get user info from Google API
  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    return response.json();
  }

  // Handle Google OAuth response
  private async handleGoogleResponse(response: any): Promise<void> {
    try {
      if (response.error) {
        console.error('Google OAuth error:', response.error);
        return;
      }

      const user = await this.getUserInfo(response.access_token);
      
      // Store user session
      localStorage.setItem('google_user', JSON.stringify(user));
      localStorage.setItem('google_token', response.access_token);

      // Emit custom event for app to handle
      window.dispatchEvent(new CustomEvent('googleAuthSuccess', { 
        detail: { user, token: response.access_token } 
      }));

    } catch (error) {
      console.error('Error handling Google response:', error);
      window.dispatchEvent(new CustomEvent('googleAuthError', { 
        detail: { error: error instanceof Error ? error.message : 'Authentication failed' } 
      }));
    }
  }

  // Sign out user
  signOut(): void {
    // Clear local storage
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_token');

    // Revoke Google token if available
    const token = localStorage.getItem('google_token');
    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      }).catch(console.error);
    }

    // Emit sign out event
    window.dispatchEvent(new CustomEvent('googleAuthSignOut'));
  }

  // Get current user
  getCurrentUser(): GoogleUser | null {
    const userStr = localStorage.getItem('google_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_token') && !!this.getCurrentUser();
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('google_token');
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService();

// Export types
export type { GoogleUser, GoogleAuthResponse };
