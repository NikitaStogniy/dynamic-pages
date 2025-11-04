import { authService } from '@/lib/services/auth.service';
import type { User } from '@/lib/db/schema';

const SESSION_TOKEN_KEY = 'sessionToken';

export interface AuthUser {
  id: number;
  email: string;
  emailVerified: boolean;
}

class AuthController {
  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  /**
   * Store session token in localStorage
   */
  private storeSessionToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
  }

  /**
   * Get session token from localStorage
   */
  getSessionToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove session token from localStorage
   */
  private removeSessionToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const response = await authService.signIn({ email, password });
    this.storeSessionToken(response.sessionToken);
    
    return {
      id: response.user.id,
      email: response.user.email,
      emailVerified: response.user.emailVerified || false,
    };
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string): Promise<AuthUser> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    const response = await authService.signUp({ email, password });
    this.storeSessionToken(response.sessionToken);
    
    return {
      id: response.user.id,
      email: response.user.email,
      emailVerified: response.user.emailVerified || false,
    };
  }

  /**
   * Check current session
   */
  async checkSession(): Promise<AuthUser | null> {
    const token = this.getSessionToken();
    if (!token) {
      return null;
    }

    try {
      const response = await authService.checkSession(token);
      if (response.valid) {
        return {
          id: response.user.id,
          email: response.user.email,
          emailVerified: response.user.emailVerified || false,
        };
      }
    } catch (error) {
      this.removeSessionToken();
    }

    return null;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const token = this.getSessionToken();
    if (token) {
      try {
        await authService.signOut(token);
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
    this.removeSessionToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getSessionToken();
  }
}

export const authController = new AuthController();
export default AuthController;