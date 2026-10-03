import { useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient, { adminApiClient } from '../services/api';
import { getEnabledLanguages } from '../services/languageService';
import { persistLangLocal } from '../utils/landingLanguage';

export function useLanguageFallback(isAdmin = false) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        const client = isAdmin ? adminApiClient : apiClient;
        const path = isAdmin ? '/portal-redthread/auth/me' : '/auth/me';
        const me = await client.get(path).catch(() => null);
        if (!me) return;
        const pref: string = me.data?.preferred_language || me.data?.preferredLanguage || 'en';
        if (!pref) return;
        const enabled = await getEnabledLanguages();
        if (!enabled.includes(pref)) {
          try {
            await client.patch(path, { preferred_language: 'en' });
          } catch {}
          persistLangLocal('en');
          const pathWithoutLocale = (router.asPath || '/').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
          window.location.href = `/en${pathWithoutLocale}`;
        }
      } catch {}
    })();
  }, [router, isAdmin]);
}
