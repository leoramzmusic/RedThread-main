import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for Admin
const adminApiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add ADMIN auth token
adminApiClient.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for login/register endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register');
    
    if (!isAuthEndpoint) {
      const token = Cookies.get('admin_access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Response interceptor - handle ADMIN token refresh
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const url = originalRequest?.url || '';

    // Important: Don't attempt to refresh if the failing request is ALREADY an auth endpoint
    const isAuthEndpoint = url.includes('/auth/login') || 
                           url.includes('/auth/register') ||
                           url.includes('/auth/refresh');

    // If 401 and not already retried and NOT an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return adminApiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('admin_refresh_token');
        if (refreshToken) {
          console.log('[AdminAPI] Attempting token refresh...');
          // Use admin-specific refresh endpoint
          const response = await axios.post(`${API_URL}/portal-redthread/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;

          Cookies.set('admin_access_token', access_token, { expires: 7, sameSite: 'lax', path: '/' });
          Cookies.set('admin_refresh_token', newRefreshToken, { expires: 7, sameSite: 'lax', path: '/' });

          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          }

          processQueue(null);
          return adminApiClient(originalRequest);
        } else {
          throw new Error('No refresh token found');
        }
      } catch (refreshError) {
        processQueue(refreshError);
        console.error('[AdminAPI] Token refresh failed:', refreshError);
        // Refresh failed, logout admin
        Cookies.remove('admin_access_token', { path: '/' });
        Cookies.remove('admin_refresh_token', { path: '/' });
        Cookies.remove('admin_user', { path: '/' });
        window.location.href = '/portal-redthread/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
       console.warn(`[AdminAPI] 401 Unauthorized for: ${url}`);
    }

    return Promise.reject(error);
  }
);

export default adminApiClient;
