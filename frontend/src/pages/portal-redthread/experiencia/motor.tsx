import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CareMotorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portal-redthread/care/equation");
  }, [router]);

  return null;
}
