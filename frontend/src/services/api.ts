import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('API Client initialized with URL:', API_URL);

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Helper to detect auth endpoints
    const isAuthEndpoint = (url?: string) => 
      url?.includes('/auth/refresh') || 
      url?.includes('/auth/logout') || 
      url?.includes('/auth/login') ||
      url?.includes('/auth/me');

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
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint directly via axios to avoid interceptor loops
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        
        // Handle refresh failure (session expired or logged out)
        if (typeof window !== 'undefined') {
             const currentPath = window.location.pathname;
             const isAuthPage = currentPath.startsWith('/auth') || 
                               currentPath.startsWith('/portal-redthread/auth');
             const isLandingPage = currentPath === '/';
             
             if (!isAuthPage && !isLandingPage) {
                 // Explicitly logout in Redux if possible or just redirect
                 window.location.href = '/auth';
             }
        }
        
        // Return a silent error object instead of a full throw to avoid some runtime overlays
        // while still rejecting the promise for the caller
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

export default apiClient;
