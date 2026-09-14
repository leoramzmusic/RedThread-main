import type { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { i18n as i18nConfig } from '../../../next-i18next.config';
import ErrorPage from '../../components/errors/ErrorPage';
import { ERROR_REGISTRY, getErrorMeta, isErrorCode } from '../../components/errors/registry';

export default function ErrorCodePage() {
  const router = useRouter();
  const raw = Number(router.query.code);
  const code = Number.isInteger(raw) ? raw : 404;
  const meta = getErrorMeta(code);

  return <ErrorPage code={meta.code} redirectTo={meta.code === 401 ? '/auth' : undefined} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const codes = Object.keys(ERROR_REGISTRY).map(Number);
  const paths = i18nConfig.locales.flatMap((locale) =>
    codes.map((code) => ({ params: { code: String(code) }, locale })),
  );

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const raw = Number(params?.code);
  if (!params || !Number.isInteger(raw) || !isErrorCode(raw)) {
    return { notFound: true };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale ?? i18nConfig.defaultLocale, ['common'])),
    },
  };
};