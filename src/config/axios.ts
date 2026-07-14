/**
 * config/axios.ts
 *
 * Centralized Axios instance with:
 *  1. Auth token injection on every request
 *  2. Transparent token refresh on 401 (with request queue)
 *  3. Auth-endpoint guard — never intercepts /login or /auth/refresh-token
 *  4. Consistent error extraction — parseApiError() reads the
 *     { success, message, code, errors } shape from every response
 *
 * CONSISTENT ERROR SHAPE (from backend):
 *   { success: false, message: string, code?: string, errors?: [{field, message}] }
 *
 * parseApiError(err) always returns a human-readable string.
 * Use it everywhere instead of manually drilling into err.response.data.message.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenManager } from "../utils/tokenManager";

// ─── Create instance ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // sends httpOnly refresh token cookie automatically
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — attach access token ────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — silent refresh on 401 ────────────────────────────

let isRefreshing = false;
// Queue of requests that arrived while a refresh was in progress
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/refresh-token") || url.includes("/login");

    // Only intercept 401s that haven't been retried yet and aren't auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit refresh endpoint — browser sends the httpOnly cookie automatically
        // Support both flat { accessToken } and nested { data: { accessToken } } shapes
        const { data } = await api.post<{
          data?: { accessToken: string };
          accessToken?: string;
        }>("/auth/refresh-token");
        const newToken = data.data?.accessToken ?? data.accessToken!;

        tokenManager.set(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenManager.clear();

        // Redirect to login — use window.location to avoid circular import with router
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ─── parseApiError ────────────────────────────────────────────────────────────
/**
 * Extract a clean human-readable message from ANY Axios error.
 *
 * Priority:
 *   1. response.data.message        (our consistent backend shape)
 *   2. response.data.errors[0].message  (validation errors)
 *   3. error.message                (network / timeout)
 *   4. fallback string
 *
 * Usage:
 *   catch (err) { setServerError(parseApiError(err)); }
 */
export function parseApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (!err) return fallback;

  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | {
          message?: string;
          errors?: { field: string; message: string }[];
        }
      | undefined;

    if (data?.message) return data.message;
    if (data?.errors?.[0]?.message) return data.errors[0].message;
    if (err.message) return err.message;
  }

  if (err instanceof Error) return err.message;

  return fallback;
}

// ─── parseFieldErrors ─────────────────────────────────────────────────────────
/**
 * Extract field-level validation errors from an Axios 400 response.
 * Returns a Record<fieldName, errorMessage> for react-hook-form setError().
 *
 * Usage:
 *   const fieldErrors = parseFieldErrors(err);
 *   Object.entries(fieldErrors).forEach(([field, message]) =>
 *     setError(field as keyof FormValues, { message })
 *   );
 */
export function parseFieldErrors(err: unknown): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const data = err.response?.data as
    | {
        errors?: { field: string; message: string }[];
      }
    | undefined;
  if (!data?.errors) return {};
  return Object.fromEntries(data.errors.map((e) => [e.field, e.message]));
}
