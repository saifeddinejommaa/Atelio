import type { Metadata } from "next";
import "./globals.css";

// Métadonnées neutres : chaque client définit les siennes dans app/[tenant]/layout.tsx.
export const metadata: Metadata = {
  title: "Entretien et réparation auto",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
