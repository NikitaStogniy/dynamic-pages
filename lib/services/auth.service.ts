export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    emailVerified?: boolean;
  };
}

export interface SessionResponse {
  user: {
    id: number;
    email: string;
    emailVerified?: boolean;
  };
  expiresAt: string;
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
      credentials: 'include', // Required for cookies
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
      credentials: 'include', // Required for cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }

    return response.json();
  }

  /**
   * Check session validity from httpOnly cookie
   */
  async checkSession(): Promise<SessionResponse> {
    const response = await fetch(`${this.basePath}/session`, {
      method: 'GET',
      credentials: 'include', // Required for cookies
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    return response.json();
  }

  /**
   * Sign out and clear httpOnly cookie
   */
  async signOut(): Promise<void> {
    await fetch(`${this.basePath}/signout`, {
      method: 'POST',
      credentials: 'include', // Required for cookies
    });
  }
}

export const authService = new AuthService();
export default AuthService;