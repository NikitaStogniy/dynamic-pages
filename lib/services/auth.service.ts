import type { User } from '@/lib/db/schema';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  sessionToken: string;
}

export interface SessionResponse {
  user: User;
  valid: boolean;
}

class AuthService {
  private readonly basePath = '/api/auth';

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.basePath}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }

    return response.json();
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.basePath}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }

    return response.json();
  }

  /**
   * Check session validity
   */
  async checkSession(sessionToken: string): Promise<SessionResponse> {
    const response = await fetch(`${this.basePath}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    return response.json();
  }

  /**
   * Sign out
   */
  async signOut(sessionToken: string): Promise<void> {
    await fetch(`${this.basePath}/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });
  }
}

export const authService = new AuthService();
export default AuthService;