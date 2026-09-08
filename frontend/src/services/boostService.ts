import apiClient from './api';

export interface BoostStatus {
    is_active: boolean;
    time_left_seconds: number;
    available_boosts: number;
    multiplier: number;
    tier: string;
    stats: {
        total_activations: number;
        total_views: number;
        total_matches: number;
        last_activation: string | null;
    };
}

export interface BoostActivationResponse {
    success: boolean;
    boost_expires_at: string;
    remaining_boosts: number;
    care_message: string;
    multiplier: number;
}

class BoostService {
    /**
     * Get current boost status for the authenticated user
     */
    async getStatus(): Promise<BoostStatus> {
        const response = await apiClient.get<BoostStatus>('/boost/status');
        return response.data;
    }

    /**
     * Activate a boost for the authenticated user
     */
    async activate(): Promise<BoostActivationResponse> {
        const response = await apiClient.post<BoostActivationResponse>('/boost/activate');
        return response.data;
    }

    /**
     * Format time left in human-readable format
     */
    formatTimeLeft(seconds: number): string {
        if (seconds <= 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

export const boostService = new BoostService();
export default boostService;
