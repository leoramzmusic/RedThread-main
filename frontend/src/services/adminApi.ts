import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for Admin
const adminApiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag and queue for synchronized token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor - handle token refresh
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Helper to detect auth endpoints (avoids refresh loops)
    const isAuthEndpoint = (url?: string) =>
      url?.includes('/portal-redthread/auth/refresh') ||
      url?.includes('/portal-redthread/auth/logout') ||
      url?.includes('/portal-redthread/auth/login') ||
      url?.includes('/portal-redthread/auth/register') ||
      url?.includes('/portal-redthread/auth/me');

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if the failed request was already an auth attempt
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => adminApiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint directly via axios to avoid interceptor loops
        await axios.post(`${API_URL}/portal-redthread/auth/refresh`, {}, { withCredentials: true });

        processQueue(null);
        return adminApiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Handle refresh failure (session expired or logged out)
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath.startsWith('/portal-redthread/auth');
          const isAdminPage = currentPath.startsWith('/portal-redthread');

          if (isAdminPage && !isAuthPage) {
            window.location.href = '/portal-redthread/auth/login';
          }
        }

        // Return a silent error object to avoid runtime overlays
        const finalError = (refreshError && typeof refreshError === 'object')
          ? { ...refreshError, _silent: true }
          : { error: refreshError, _silent: true };

        return Promise.reject(finalError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default adminApiClient;