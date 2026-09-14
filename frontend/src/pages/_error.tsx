import type { NextPage } from 'next';
import ErrorPage from '../components/errors/ErrorPage';

interface ErrorProps {
  statusCode?: number;
}

/**
 * Página de error avanzada (solo producción) vía getInitialProps.
 * No puede usar getStaticProps/serverSideTranslations: ErrorPage
 * resuelve todo con defaults ES + `t()` (fallback del catálogo).
 */
const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  const code = statusCode ?? 404;
  return <ErrorPage code={code} />;
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default Error;