import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma Boutique",
  description: "Gestion simple de la boutique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
