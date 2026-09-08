import AuthLayout from '../../components/auth/AuthLayout';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ResetPasswordPage() {
    return (
        <AuthLayout
            title="Crea una nueva contraseña"
            subtitle="Ingresa tu nueva contraseña para recuperar el acceso"
        >
            <ResetPasswordForm />
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
