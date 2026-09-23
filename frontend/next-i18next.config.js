module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en','es','pt','fr','de','it','ru','sv','nl','zh','hi','bn','ja','ko','ar','sw','ha','am','tl','ms','mi'],
    localeDetection: false,
  },
  fallbackLng: 'en',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
