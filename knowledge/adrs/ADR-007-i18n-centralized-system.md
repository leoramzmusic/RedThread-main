# ADR-007: Centralized i18n System with i18next and next-i18next

## Status
Accepted

## Context
The RETH frontend application supports 21 languages but was using hardcoded inline translations in the landing page (`src/pages/index.tsx`) instead of the centralized i18n system. This created several problems:

1. **Duplication**: Same strings repeated across components
2. **Inconsistency**: Translations diverged between pages
3. **Maintenance burden**: Manual updates required for each language
4. **No automation**: New strings weren't automatically extracted
5. **SSR issues**: Landing page wasn't using `getStaticProps` with `serverSideTranslations`

The project already had:
- `i18next` and `react-i18next` installed
- `next-i18next` configured with 21 locales
- Translation files in `public/locales/{lang}/{namespace}.json`
- Language configuration in `src/config/languages.ts`

## Decision
We will standardize on a centralized i18n workflow:

### 1. Translation Structure
- **Namespaces**: Feature-based (e.g., `landing`, `discover`, `profile`, `auth`, `common`)
- **Location**: `frontend/public/locales/{lang}/{namespace}.json`
- **Keys**: Dot-notation (e.g., `hero.subtitle`, `features.smartMatching.title`)

### 2. Adding New Translations
1. **Developers**: Use `useTranslation('namespace')` hook and `t('key.path')`
2. **Extraction**: Run `npm run i18n:extract` to scan codebase and update JSON files
3. **Translation**: Use automated tools (LibreTranslate, Argos Translate, Google Sheets) for initial translation of new keys
4. **Review**: Manual review of key user-facing strings (landing, onboarding, profile)

### 3. SSR Configuration
All pages must export `getStaticProps` or `getServerSideProps` with `serverSideTranslations`:

```typescript
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['namespace1', 'namespace2'])),
    },
  };
}
```

### 4. Language Switching
- Uses `next-i18next` built-in locale routing (`/es/page`, `/en/page`)
- User preference stored in localStorage and synced to profile via API
- `landingLanguage.ts` utilities handle resolution logic

### 5. Automated Extraction
Configured `i18next-scanner` to:
- Scan `src/**/*.{ts,tsx}` for `t()` and `useTranslation()` calls
- Support `Trans` components
- Output to existing `public/locales/` structure
- Support all 21 configured languages

## Consequences

### Positive
- Single source of truth for all translations
- Automated extraction prevents missing keys
- Consistent translations across features
- SSR-ready for SEO and performance
- Scales to 21 languages without code changes

### Negative
- Initial migration effort for existing hardcoded strings
- Need to run extraction after adding new strings
- Translation review process required for quality

## Implementation Checklist
- [x] Create `landing.json` namespace for en/es
- [x] Migrate `index.tsx` to use `useTranslation('landing')`
- [x] Add `getStaticProps` with `serverSideTranslations`
- [x] Configure `i18next-scanner` with all 21 languages
- [x] Add npm scripts: `i18n:extract` and `i18n:extract:watch`
- [ ] Migrate remaining pages (discover, auth, profile, etc.)
- [ ] Document workflow in CONTRIBUTING.md
- [ ] Set up CI check for missing translations

## Related Files
- `frontend/next-i18next.config.js` — i18n configuration
- `frontend/src/config/languages.ts` — Supported languages list
- `frontend/public/locales/{lang}/landing.json` — Landing page translations
- `frontend/i18next-scanner.config.js` — Extraction configuration
- `frontend/src/utils/landingLanguage.ts` — Language resolution utilities