import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CreateClientOptions {
  authPrefix?: string;
  refreshPath?: string;
  logoutRedirect?: string;
  authEndpoints?: string[];
}

export function createApiClient(options: CreateClientOptions = {}): AxiosInstance {
  const {
    authPrefix = '/auth',
    refreshPath = '/auth/refresh',
    logoutRedirect = '/auth?expired=1',
    authEndpoints = ['/auth/refresh', '/auth/logout', '/auth/login', '/auth/me'],
  } = options;

  const client: AxiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

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

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (authEndpoints.some((ep) => originalRequest.url?.includes(ep))) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => client(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post(`${API_URL}${refreshPath}`, {}, { withCredentials: true });
          processQueue(null);
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);

          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.startsWith(authPrefix);
            if (!isAuthPage) {
              window.location.href = logoutRedirect;
            }
          }

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

  return client;
}

// User API client
console.log('API Client initialized with URL:', API_URL);
const apiClient = createApiClient();
export default apiClient;

// Admin API client
export const adminApiClient = createApiClient({
  refreshPath: '/portal-redthread/auth/refresh',
  logoutRedirect: '/portal-redthread/auth/login',
  authEndpoints: [
    '/portal-redthread/auth/refresh',
    '/portal-redthread/auth/logout',
    '/portal-redthread/auth/login',
    '/portal-redthread/auth/register',
    '/portal-redthread/auth/me',
  ],
});
