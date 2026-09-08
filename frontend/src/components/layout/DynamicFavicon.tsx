import { useEffect, useState } from 'react';
import Head from 'next/head';
import appearanceService from '../../services/appearanceService';
import { AppearanceType, Platform, AppearanceResource } from '../../types/appearance';

import { useRouter } from 'next/router';

export default function DynamicFavicon() {
    const [favicons, setFavicons] = useState<AppearanceResource[]>([]);
    const [defaultFavicon, setDefaultFavicon] = useState('/favicon.ico');
    const router = useRouter();

    useEffect(() => {
        const fetchFavicons = async () => {
            try {
                // Determine context based on route
                // If route starts with /portal-redthread -> Admin Favicon (FAVICON)
                // Else -> User Favicon (FAVICON_USER)
                const isAdmin = router.pathname.startsWith('/portal-redthread');
                const targetType = isAdmin ? AppearanceType.FAVICON : AppearanceType.FAVICON_USER;

                // Fetch active favicons for the target type
                const resources = await appearanceService.getResources(targetType, Platform.WEB);
                const active = resources.filter((r: AppearanceResource) => r.is_active);

                // If user portal has no specific favicon, we could fallback to generic one?
                // For now, let's strictly respect the type. If empty, falls back to defaultFavicon.
                if (active.length > 0) {
                    setFavicons(active);
                } else {
                    setFavicons([]); // Reset to default if no active custom icon found
                }
            } catch (error) {
                console.error("Failed to fetch dynamic favicons", error);
            }
        };

        fetchFavicons();

        const handleUpdate = () => {
            fetchFavicons();
        };

        window.addEventListener('appearance:update', handleUpdate);
        // Also listen to route changes to switch favicon context
        router.events.on('routeChangeComplete', fetchFavicons);

        return () => {
            window.removeEventListener('appearance:update', handleUpdate);
            router.events.off('routeChangeComplete', fetchFavicons);
        };
    }, [router.pathname]); // Re-run when pathname changes (context switch)

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
                    href={`${getFullUrl(icon.url)}?t=${new Date().getTime()}`}
                    sizes={icon.resolution || 'any'}
                    type="image/png"
                />
            ))}
        </Head>
    );
}
