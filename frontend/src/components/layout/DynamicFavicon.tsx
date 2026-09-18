import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import appearanceService from '../../services/appearanceService';
import { AppearanceType, Platform, AppearanceResource } from '../../types/appearance';

import { useRouter } from 'next/router';

const faviconCache = new Map<string, AppearanceResource[]>();

export default function DynamicFavicon() {
    const [favicons, setFavicons] = useState<AppearanceResource[]>([]);
    const [defaultFavicon] = useState('/favicon.ico');
    const router = useRouter();
    const lastTypeRef = useRef<string>('');

    useEffect(() => {
        const isAdmin = router.pathname.startsWith('/portal-redthread');
        const targetType = isAdmin ? AppearanceType.FAVICON : AppearanceType.FAVICON_USER;
        const cacheKey = targetType;

        // Skip if same type and already cached
        if (lastTypeRef.current === cacheKey && faviconCache.has(cacheKey)) {
            setFavicons(faviconCache.get(cacheKey)!);
            return;
        }

        lastTypeRef.current = cacheKey;

        // Check cache first
        if (faviconCache.has(cacheKey)) {
            setFavicons(faviconCache.get(cacheKey)!);
            return;
        }

        let cancelled = false;
        const fetchFavicons = async () => {
            try {
                const resources = await appearanceService.getPublicResources(targetType, Platform.WEB);
                const active = resources.filter((r: AppearanceResource) => r.is_active);
                if (!cancelled) {
                    faviconCache.set(cacheKey, active);
                    setFavicons(active);
                }
            } catch (error) {
                console.error("Failed to fetch dynamic favicons", error);
            }
        };

        fetchFavicons();

        const handleUpdate = () => {
            faviconCache.delete(cacheKey);
            fetchFavicons();
        };

        window.addEventListener('appearance:update', handleUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener('appearance:update', handleUpdate);
        };
    }, [router.pathname]);

    const getFullUrl = (url: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return url.startsWith('http') ? url : `${apiUrl}${url}`;
    };

    return (
        <Head>
            {favicons.length === 0 && <link rel="icon" href={defaultFavicon} />}

            {favicons.map(icon => (
                <link
                    key={icon._id}
                    rel={icon.resolution === '180x180' ? 'apple-touch-icon' : 'icon'}
                    href={getFullUrl(icon.url)}
                    sizes={icon.resolution || 'any'}
                    type="image/png"
                />
            ))}
        </Head>
    );
}
