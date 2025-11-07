import { authService } from "@/lib/services/auth.service";

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
      return {
        valid: false,
        message: "Password must be at least 6 characters long",
      };
    }
    return { valid: true };
  }

  /**
   * Sign in user (session stored in httpOnly cookie)
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!this.validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    const response = await authService.signIn({ email, password });

    return {
      id: response.user.id,
      email: response.user.email,
      emailVerified: response.user.emailVerified || false,
    };
  }

  /**
   * Sign up new user (session stored in httpOnly cookie)
   */
  async signUp(email: string, password: string): Promise<AuthUser> {
    if (!this.validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    const response = await authService.signUp({ email, password });

    return {
      id: response.user.id,
      email: response.user.email,
      emailVerified: response.user.emailVerified || false,
    };
  }

  /**
   * Check current session from httpOnly cookie
   */
  async checkSession(): Promise<AuthUser | null> {
    try {
      const response = await authService.checkSession();
      return {
        id: response.user.id,
        email: response.user.email,
        emailVerified: response.user.emailVerified || false,
      };
    } catch {
      // Session invalid or expired
      return null;
    }
  }

  /**
   * Sign out user (clears httpOnly cookie on server)
   */
  async signOut(): Promise<void> {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }
}

export const authController = new AuthController();
export default AuthController;
