"use client";

import { useEffect } from "react";
import TechnicalError from "@/components/TechnicalError";
import "./globals.css";

/** Erreur dans la mise en page de la marque elle-même : remplace tout le document. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <title>Problème technique</title>
        <TechnicalError onRetry={retry} />
      </body>
    </html>
  );
}
