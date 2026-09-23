import { useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient, { adminApiClient } from '../services/api';
import { getEnabledLanguages } from '../services/languageService';

export function useLanguageFallback(isAdmin = false) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        const client = isAdmin ? adminApiClient : apiClient;
        const me = await client.get('/auth/me').catch(() => null);
        if (!me) return;
        const pref: string = me.data?.preferred_language || me.data?.preferredLanguage || 'en';
        if (!pref) return;
        const enabled = await getEnabledLanguages();
        if (!enabled.includes(pref)) {
          try {
            await client.patch('/auth/me', { preferred_language: 'en' });
          } catch {}
          localStorage.setItem('preferred_language', 'en');
          document.cookie = `NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax`;
          const pathWithoutLocale = (router.asPath || '/').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
          window.location.href = `/en${pathWithoutLocale}`;
        }
      } catch {}
    })();
  }, [router, isAdmin]);
}
