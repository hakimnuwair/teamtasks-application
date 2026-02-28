/**
 * In-memory Access Token Manager
 *
 * - Access token is stored ONLY in memory.
 * - Refresh token is stored in httpOnly cookie (backend controlled).
 * - On page reload, access token is lost intentionally.
 * - Axios interceptor will call /auth/refresh-token automatically.
 */

let _accessToken: string | null = null;

export const tokenManager = {
  /**
   * Get current access token
   */
  get(): string | null {
    return _accessToken;
  },

  /**
   * Set new access token
   * Called after:
   * - login
   * - successful refresh
   */
  set(token: string): void {
    _accessToken = token;
  },

  /**
   * Clear token (logout or refresh failure)
   */
  clear(): void {
    _accessToken = null;
  },

  /**
   * Optional helper (not required but useful)
   */
  hasToken(): boolean {
    return _accessToken !== null;
  },
};
