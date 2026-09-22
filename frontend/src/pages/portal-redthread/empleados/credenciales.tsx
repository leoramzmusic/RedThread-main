import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CredencialesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portal-redthread/empleados/EmployeeIdDesign');
  }, [router]);
  return null;
}
