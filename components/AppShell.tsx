"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

// Coquille de l'app : barre du haut + menu coulissant sur téléphone, sidebar fixe sur ordinateur.
export default function AppShell({
  nom,
  role,
  children,
}: {
  nom: string;
  role: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <div className="mobile-topbar">
        <button
          type="button"
          className="burger"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>
        <span className="mt-brand">Ma Boutique</span>
      </div>

      {open ? (
        <div className="overlay" onClick={() => setOpen(false)} aria-hidden />
      ) : null}

      <Sidebar nom={nom} role={role} open={open} onNavigate={() => setOpen(false)} />

      <main className="main">{children}</main>
    </div>
  );
}
