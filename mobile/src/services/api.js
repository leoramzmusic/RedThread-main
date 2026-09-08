import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';

const API_URL = Config.API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await EncryptedStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await EncryptedStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token: newRefreshToken } = response.data;

                    // Store new tokens
                    await EncryptedStorage.setItem('access_token', access_token);
                    await EncryptedStorage.setItem('refresh_token', newRefreshToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                await EncryptedStorage.clear();
                // Navigate to login screen (implement navigation logic)
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        await EncryptedStorage.clear();
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

export const profileAPI = {
    getProfile: async () => {
        const response = await api.get('/profiles/me');
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await api.put('/profiles/me', profileData);
        return response.data;
    },

    uploadPhoto: async (photoUri) => {
        const formData = new FormData();
        formData.append('file', {
            uri: photoUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        });

        const response = await api.post('/profiles/photos/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export const discoveryAPI = {
    getQueue: async (filters = {}) => {
        const response = await api.get('/discovery/queue', { params: filters });
        return response.data;
    },

    swipe: async (targetUserId, interaction) => {
        const response = await api.post('/discovery/swipe', {
            target_user_id: targetUserId,
            interaction,
        });
        return response.data;
    },

    getMatches: async () => {
        const response = await api.get('/discovery/matches');
        return response.data;
    },
};

export const chatAPI = {
    getConversations: async () => {
        const response = await api.get('/chat/conversations');
        return response.data;
    },

    getMessages: async (conversationId) => {
        const response = await api.get(`/chat/messages/${conversationId}`);
        return response.data;
    },

    sendMessage: async (conversationId, content) => {
        const response = await api.post('/chat/send', {
            conversation_id: conversationId,
            content,
        });
        return response.data;
    },
};

export default api;
