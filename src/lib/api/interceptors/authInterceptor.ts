import { logger } from '@/utils/logger'; /**
 * Authentication Interceptor
 * Handles automatic token refresh and session management
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ApiRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  data: unknown;
  status: number;
  headers: Record<string, string>;
  success?: boolean;
  message?: string;
}

class AuthInterceptor {
  private static instance: AuthInterceptor | undefined;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  private isAuthTokens(value: unknown): value is AuthTokens {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.accessToken === 'string' &&
      typeof v.refreshToken === 'string' &&
      typeof v.expiresAt === 'number'
    );
  }

  static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  getTokens(): AuthTokens | null {
    if (!this.tokens) {
      const stored = localStorage.getItem('auth_tokens');
      if (stored) {
        try {
          const parsed: unknown = JSON.parse(stored);
          if (this.isAuthTokens(parsed)) {
            this.tokens = parsed;
          } else {
            this.clearTokens();
          }
        } catch (error) {
          logger.error('Failed to parse stored tokens:', error);
          this.clearTokens();
        }
      }
    }
    return this.tokens;
  }

  clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem('auth_tokens');
    this.refreshPromise = null;
  }

  private isTokenExpired(token: AuthTokens): boolean {
    return Date.now() >= token.expiresAt - 30000; // 30s buffer
  }

  private async refreshTokens(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const tokens = this.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(tokens.refreshToken);

    try {
      const newTokens = await this.refreshPromise;
      this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      this.clearTokens();
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>).accessToken === 'string' &&
      typeof (data as Record<string, unknown>).refreshToken === 'string' &&
      typeof (data as Record<string, unknown>).expiresIn === 'number'
    ) {
      const d = data as { accessToken: string; refreshToken: string; expiresIn: number };
      return {
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
        expiresAt: Date.now() + d.expiresIn * 1000,
      };
    }
    throw new Error('Invalid token refresh response shape');
  }

  async interceptRequest(request: ApiRequest): Promise<ApiRequest> {
    let tokens = this.getTokens();

    // Skip auth for auth endpoints
    if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
      return request;
    }

    if (tokens && this.isTokenExpired(tokens)) {
      try {
        tokens = await this.refreshTokens();
      } catch (error) {
        logger.error('Token refresh failed:', error);
        // Redirect to login or handle auth failure
        window.location.href = '/auth/login';
        throw error;
      }
    }

    if (tokens?.accessToken) {
      request.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return request;
  }

  async interceptResponse(
    response: ApiResponse,
    originalRequest: ApiRequest
  ): Promise<ApiResponse> {
    // Handle 401 unauthorized responses
    if (response.status === 401) {
      try {
        const newTokens = await this.refreshTokens();

        // Retry original request with new token
        const retryRequest: ApiRequest = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newTokens.accessToken}`,
          },
        };

        // Return indication that request should be retried
        return {
          ...response,
          data: { shouldRetry: true, retryRequest },
        };
      } catch (error) {
        this.clearTokens();
        window.location.href = '/auth/login';
        throw error;
      }
    }

    return response;
  }
}

export const authInterceptor = AuthInterceptor.getInstance();
