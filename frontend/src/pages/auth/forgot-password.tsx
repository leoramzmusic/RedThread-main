import AuthLayout from '../../components/auth/AuthLayout';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ForgotPasswordPage() {
    return (
        <AuthLayout
            title="Recupera tu contraseña"
            subtitle="Ingresa tu correo electrónico para recibir instrucciones"
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
