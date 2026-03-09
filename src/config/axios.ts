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
    // Only intercept 401s that haven't been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint // ← don't intercept auth endpoints
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
        const { data } = await api.post<{ accessToken: string }>(
          "/auth/refresh-token",
        );
        const newToken = data.accessToken;

        tokenManager.set(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenManager.clear();

        // Redirect to login — use window.location to avoid circular import with router
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
