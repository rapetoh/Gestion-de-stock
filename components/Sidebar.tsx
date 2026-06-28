"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deconnexion } from "@/app/(app)/actions";

type Props = {
  nom: string;
  role: string;
  open?: boolean;
  onNavigate?: () => void;
};

const NAV_PRINCIPAL = [{ href: "/", ic: "▣", label: "Tableau de bord" }];
const NAV_JOUR = [
  { href: "/produits", ic: "▥", label: "Produits" },
  { href: "/achats", ic: "↓", label: "Achats" },
  { href: "/ventes", ic: "↑", label: "Ventes" },
  { href: "/stock", ic: "▤", label: "Stock" },
];
const NAV_CONTROLE = [
  { href: "/controle", ic: "⊙", label: "Contrôle de stock" },
  { href: "/soldes", ic: "⚖", label: "Soldes du jour" },
  { href: "/commissions", ic: "📲", label: "Commissions" },
  { href: "/depenses", ic: "▦", label: "Dépenses" },
  { href: "/benefices", ic: "★", label: "Bénéfices" },
  { href: "/activite", ic: "≣", label: "Activité" },
  { href: "/sauvegarde", ic: "⤓", label: "Sauvegarde" },
];

function roleLabel(role: string): string {
  return role === "proprietaire" ? "Propriétaire" : "Vendeuse";
}

export default function Sidebar({ nom, role, open = false, onNavigate }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItem = (item: { href: string; ic: string; label: string }) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className={`nav-item${isActive(item.href) ? " active" : ""}`}
    >
      <span className="ic">{item.ic}</span> {item.label}
    </Link>
  );

  const initiale = (nom || "?").charAt(0).toUpperCase();

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <div className="logo">B</div>
        <div>
          <div className="name">Ma Boutique</div>
          <div className="sub">Clinique St-Joseph</div>
        </div>
      </div>

      {NAV_PRINCIPAL.map(renderItem)}
      <div className="nav-label">Au jour le jour</div>
      {NAV_JOUR.map(renderItem)}
      <div className="nav-label">Contrôle &amp; argent</div>
      {NAV_CONTROLE.map(renderItem)}

      <div className="spacer"></div>

      <div className="userbox">
        <div className="av">{initiale}</div>
        <div style={{ flex: 1 }}>
          <div className="who">{nom}</div>
          <div className="role">{roleLabel(role)}</div>
        </div>
      </div>
      <form action={deconnexion}>
        <button
          type="submit"
          className="btn ghost"
          style={{ width: "100%", marginTop: 4 }}
        >
          Se déconnecter
        </button>
      </form>
    </aside>
  );
}
