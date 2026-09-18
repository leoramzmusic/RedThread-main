const path = require('path');
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: path.resolve(__dirname),
    },
    reactStrictMode: true,
    i18n,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
            {
                protocol: 'https',
                hostname: 'storage.example.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    },
    async headers() {
        const base = [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-DNS-Prefetch-Control', value: 'off' },
            {
                key: 'Permissions-Policy',
                value: 'geolocation=(self), camera=(self), microphone=(self)',
            },
        ];
        if (process.env.NODE_ENV !== 'development') {
            base.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
        }
        return [
            {
                source: '/(.*)',
                headers: base,
            },
        ];
    },
}

module.exports = nextConfig
