import axios from 'axios';
import apiClient from './api';

// Types for Spotify Data
export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string; height: number; width: number }[];
    };
    preview_url: string | null;
    external_urls: { spotify: string };
}

export interface SpotifyArtist {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    genres: string[];
    external_urls: { spotify: string };
}

// Mock Data for Development without Keys
const MOCK_TRACKS: SpotifyTrack[] = [
    {
        id: '1',
        name: 'Blinding Lights',
        artists: [{ name: 'The Weeknd' }],
        album: { name: 'After Hours', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c8ea321f5b9f62ca65191986', height: 640, width: 640 }] },
        preview_url: 'https://p.scdn.co/mp3-preview/2f37da1d4221f40b9d1a98cd191f4d6f1646ad17',
        external_urls: { spotify: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b' }
    },
    {
        id: '2',
        name: 'Levitating',
        artists: [{ name: 'Dua Lipa' }],
        album: { name: 'Future Nostalgia', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327060d49940', height: 640, width: 640 }] },
        preview_url: 'https://p.scdn.co/mp3-preview/2f37da1d4221f40b9d1a98cd191f4d6f1646ad17', // Reused for mock
        external_urls: { spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP' }
    },
    {
        id: '3',
        name: 'Me Porto Bonito',
        artists: [{ name: 'Bad Bunny' }, { name: 'Chencho Corleone' }],
        album: { name: 'Un Verano Sin Ti', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b27349d694203245f241a1bcaa72', height: 640, width: 640 }] },
        preview_url: 'https://p.scdn.co/mp3-preview/2f37da1d4221f40b9d1a98cd191f4d6f1646ad17', // Reused for mock
        external_urls: { spotify: 'https://open.spotify.com/track/6Sq7ltF9Qa7SNFBsV5Cogx' }
    }
];

const MOCK_ARTISTS: SpotifyArtist[] = [
    {
        id: '1',
        name: 'The Weeknd',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb', height: 640, width: 640 }],
        genres: ['pop', 'r&b'],
        external_urls: { spotify: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ' }
    },
    {
        id: '2',
        name: 'Dua Lipa',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb6693a85b1d42a4980072f534', height: 640, width: 640 }],
        genres: ['pop', 'dance pop'],
        external_urls: { spotify: 'https://open.spotify.com/artist/6M2wZ9GZgrQXHCFfjv46we' }
    },
    {
        id: '3',
        name: 'Bad Bunny',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb49d694203245f241a1bcaa72', height: 640, width: 640 }],
        genres: ['trap latino', 'reggaeton'],
        external_urls: { spotify: 'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X' }
    },
    {
        id: '4',
        name: 'Shakira',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebb19af0ea736c6228d6eb539c', height: 640, width: 640 }],
        genres: ['latin pop', 'pop'],
        external_urls: { spotify: 'https://open.spotify.com/artist/0EmeFodog0BfCgMzAIvKQp' }
    },
    {
        id: '5',
        name: 'Lifehouse',
        images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb5f37063f69aa284d7ed43b74', height: 640, width: 640 }],
        genres: ['alternative rock', 'pop rock'],
        external_urls: { spotify: 'https://open.spotify.com/artist/4i0febJ8A366v75J0k5VvR' }
    }
];

class SpotifyService {
    private token: string | null = null;
    private baseUrl = 'https://api.spotify.com/v1';

    setToken(token: string) {
        this.token = token;
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // New method to fetch token from backend proxy
    async fetchToken() {
        try {
            const response = await apiClient.get('/api/auth/spotify/token');
            if (response.data.authenticated && response.data.token) {
                this.token = response.data.token;
                console.log('SpotifyService: Token fetched from backend');
            } else {
                console.warn('SpotifyService: Not authenticated with backend');
            }
        } catch (error) {
            console.error('SpotifyService: Error fetching token', error);
        }
    }

    async searchTracks(query: string): Promise<SpotifyTrack[]> {
        // console.log('SpotifyService: searchTracks called with query:', query);
        
        if (!this.token) await this.fetchToken(); 

        // If we still don't have a token, use the BACKEND PROXY which handles client_credentials
        if (!this.token) {
            try {
                // console.log('SpotifyService: Using Backend Proxy for Search (Disconnected)...');
                const response = await apiClient.get('/api/auth/spotify/search', {
                    params: { q: query, type: 'track' }
                });
                return response.data.tracks?.items || [];
            } catch (proxyError) {
                console.error('Backend Proxy Search Error:', proxyError);
                return [];
            }
        }

        // Standard User Token Search
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: this.getHeaders(),
                params: { q: query, type: 'track', limit: 10 }
            });
            return response.data.tracks.items;
        } catch (error) {
            console.error('Spotify Search Error:', error);
            return [];
        }
    }

    async searchArtists(query: string): Promise<SpotifyArtist[]> {
        // console.log('SpotifyService: searchArtists called with query:', query);

        if (!this.token) await this.fetchToken();

        // If we still don't have a token, use the BACKEND PROXY which handles client_credentials
        if (!this.token) {
            try {
                // console.log('SpotifyService: Using Backend Proxy for Artist Search (Disconnected)...');
                const response = await apiClient.get('/api/auth/spotify/search', {
                    params: { q: query, type: 'artist' }
                });
                return response.data.artists?.items || [];
            } catch (proxyError) {
                console.error('Backend Proxy Artist Search Error:', proxyError);
                return [];
            }
        }

        // Standard User Token Search
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: this.getHeaders(),
                params: { q: query, type: 'artist', limit: 10 }
            });
            return response.data.artists.items;
        } catch (error) {
            console.error('Spotify Artist Search Error:', error);
            return [];
        }
    }

    getTrackImage(track: SpotifyTrack): string {
        return track.album.images[0]?.url || '';
    }

    getArtistImage(artist: SpotifyArtist): string {
        return artist.images[0]?.url || '';
    }
}

export const spotifyService = new SpotifyService();
