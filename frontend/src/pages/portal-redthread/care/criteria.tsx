import { useEffect } from "react";
import { useRouter } from "next/router";

const EQUATION_PATH = "/portal-redthread/care/equation";

/**
 * Legacy route: the criteria panel was merged into the equation editor
 * (KPI headers + weights table + live Σ + Guardar live there now).
 */
export default function CareCriteriaPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace(EQUATION_PATH);
  }, [router]);

  return null;
}
