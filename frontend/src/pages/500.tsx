import type { NextPage } from 'next';
import ErrorPage from '../components/errors/ErrorPage';

const ErrorPage500: NextPage = () => {
  return <ErrorPage code={500} />;
};

export default ErrorPage500;