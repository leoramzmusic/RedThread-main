import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CareMotorPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/portal-redthread/care/criteria');
    }, [router]);

    return null;
}
