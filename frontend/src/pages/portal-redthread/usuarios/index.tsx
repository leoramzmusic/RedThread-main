import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the listado page
    router.replace('/portal-redthread/usuarios/listado');
  }, [router]);

  return null;
}
