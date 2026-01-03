/**
 * Auth Service - gRPC-Web Client
 * 
 * Handles user authentication: registration, login, token management
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient, tokenManager, GrpcApiError, GrpcStatus } from './client';
import { SERVICES } from './types';
import type {
  RegisterRequest,
  LoginRequest,
  SocialLoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  CurrentUser,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Auth Service client for React Native
 * 
 * Usage:
 * ```typescript
 * import { authService } from '@/services/grpc';
 * 
 * // Register
 * const result = await authService.register({
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   displayName: 'John Doe',
 *   preferredLanguage: Language.FR,
 * });
 * 
 * // Login
 * const auth = await authService.login({
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 * });
 * 
 * // Access user profile
 * console.log(auth.user?.displayName);
 * ```
 */
class AuthService {
  private readonly service = SERVICES.AUTH;

  /**
   * Initialize the auth service
   * Call this on app startup to restore tokens from storage
   */
  async initialize(): Promise<void> {
    await tokenManager.initialize();
    
    // Set up token refresh callback
    tokenManager.setRefreshCallback(async () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) return null;
      
      try {
        const response = await this.refreshToken({ refreshToken });
        return {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        };
      } catch {
        return null;
      }
    });
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await grpcClient.unary<RegisterRequest, AuthResponse>(
      this.service,
      'Register',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );

    // Store tokens
    await tokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await grpcClient.unary<LoginRequest, AuthResponse>(
      this.service,
      'Login',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );

    // Store tokens
    await tokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(request: SocialLoginRequest): Promise<AuthResponse> {
    const response = await grpcClient.unary<SocialLoginRequest, AuthResponse>(
      this.service,
      'LoginWithGoogle',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );

    await tokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Login with Apple Sign-In
   */
  async loginWithApple(request: SocialLoginRequest): Promise<AuthResponse> {
    const response = await grpcClient.unary<SocialLoginRequest, AuthResponse>(
      this.service,
      'LoginWithApple',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );

    await tokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Refresh access token
   * Usually called automatically by the client
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    return grpcClient.unary<RefreshTokenRequest, AuthResponse>(
      this.service,
      'RefreshToken',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );
  }

  /**
   * Logout current device
   */
  async logout(request?: LogoutRequest): Promise<void> {
    try {
      await grpcClient.unary<LogoutRequest, Record<string, never>>(
        this.service,
        'Logout',
        request || {},
        { timeout: TIMEOUTS.auth, retryEnabled: false }
      );
    } finally {
      // Always clear local tokens, even if server call fails
      await tokenManager.clearTokens();
    }
  }

  /**
   * Logout all devices
   */
  async logoutAll(request?: LogoutRequest): Promise<void> {
    try {
      await grpcClient.unary<LogoutRequest, Record<string, never>>(
        this.service,
        'LogoutAll',
        request || {},
        { timeout: TIMEOUTS.auth, retryEnabled: false }
      );
    } finally {
      await tokenManager.clearTokens();
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await grpcClient.unary<ForgotPasswordRequest, Record<string, never>>(
      this.service,
      'ForgotPassword',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );
  }

  /**
   * Reset password with token from email
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await grpcClient.unary<ResetPasswordRequest, Record<string, never>>(
      this.service,
      'ResetPassword',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );
  }

  /**
   * Change password (requires authentication)
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await grpcClient.unary<ChangePasswordRequest, Record<string, never>>(
      this.service,
      'ChangePassword',
      request,
      { timeout: TIMEOUTS.auth }
    );
  }

  /**
   * Verify email with token
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await grpcClient.unary<VerifyEmailRequest, Record<string, never>>(
      this.service,
      'VerifyEmail',
      request,
      { timeout: TIMEOUTS.auth }
    );
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(request: ResendVerificationRequest): Promise<void> {
    await grpcClient.unary<ResendVerificationRequest, Record<string, never>>(
      this.service,
      'ResendVerificationEmail',
      request,
      { timeout: TIMEOUTS.auth }
    );
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return grpcClient.unary<Record<string, never>, CurrentUser>(
      this.service,
      'GetCurrentUser',
      {},
      { timeout: TIMEOUTS.auth }
    );
  }

  /**
   * Validate a token
   */
  async validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return grpcClient.unary<ValidateTokenRequest, ValidateTokenResponse>(
      this.service,
      'ValidateToken',
      request,
      { timeout: TIMEOUTS.auth, retryEnabled: false }
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  }

  /**
   * Get current access token (for debugging/display)
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }
}

// Singleton instance
export const authService = new AuthService();
