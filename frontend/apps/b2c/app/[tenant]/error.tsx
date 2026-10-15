"use client";

import { useEffect } from "react";
import TechnicalError from "@/components/TechnicalError";

/** Erreur dans une page de la marque (affichée sous l'en-tête du site). */
export default function TenantError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <TechnicalError onRetry={retry} />;
}
