"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CircleHelp,
  ClipboardCheck,
  DatabaseBackup,
  History,
  LayoutDashboard,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { deconnexion } from "@/app/(app)/actions";

type Props = {
  nom: string;
  role: string;
  open?: boolean;
  onNavigate?: () => void;
};

// Icônes : une métaphore par écran, pas des glyphes décoratifs.
// Achats = la marchandise qui arrive (camion) ; Ventes = le client qui achète (panier) ;
// Contrôle = compter contre une liste ; Soldes = l'argent lui-même ; Commissions = un %.
const NAV_PRINCIPAL = [{ href: "/", ic: LayoutDashboard, label: "Tableau de bord" }];
const NAV_JOUR = [
  { href: "/produits", ic: Package, label: "Produits" },
  { href: "/achats", ic: Truck, label: "Achats" },
  { href: "/ventes", ic: ShoppingCart, label: "Ventes" },
  { href: "/stock", ic: Boxes, label: "Stock" },
];
const NAV_CONTROLE = [
  { href: "/controle", ic: ClipboardCheck, label: "Contrôle de stock" },
  { href: "/soldes", ic: Wallet, label: "Soldes du jour" },
  { href: "/commissions", ic: Percent, label: "Commissions" },
  { href: "/depenses", ic: Receipt, label: "Dépenses" },
  { href: "/benefices", ic: TrendingUp, label: "Bénéfices" },
  { href: "/activite", ic: History, label: "Activité" },
  { href: "/equipe", ic: Users, label: "Équipe" },
  { href: "/sauvegarde", ic: DatabaseBackup, label: "Sauvegarde" },
];

// La vendeuse n'a que sa caisse et le stock : pas les marges, l'argent, ni la gestion.
const NAV_VENDEUSE = [
  { href: "/ventes", ic: ShoppingCart, label: "Ventes" },
  { href: "/stock", ic: Boxes, label: "Stock" },
];

// L'aide est accessible aux deux rôles (rendue tout en bas du menu).
const AIDE = { href: "/aide", ic: CircleHelp, label: "Aide" };

function roleLabel(role: string): string {
  return role === "proprietaire" ? "Propriétaire" : "Vendeuse";
}

export default function Sidebar({ nom, role, open = false, onNavigate }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItem = (item: { href: string; ic: LucideIcon; label: string }) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      data-tour={item.href}
      className={`nav-item${isActive(item.href) ? " active" : ""}`}
    >
      <span className="ic">
        <item.ic size={18} strokeWidth={1.9} aria-hidden />
      </span>{" "}
      {item.label}
    </Link>
  );

  const initiale = (nom || "?").charAt(0).toUpperCase();
  const estProprietaire = role === "proprietaire";

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <div className="logo">P</div>
        <div>
          <div className="name">Mon Panier</div>
        </div>
      </div>

      {estProprietaire ? (
        <>
          {NAV_PRINCIPAL.map(renderItem)}
          <div className="nav-label">Au jour le jour</div>
          {NAV_JOUR.map(renderItem)}
          <div className="nav-label">Contrôle &amp; argent</div>
          {NAV_CONTROLE.map(renderItem)}
        </>
      ) : (
        <>
          <div className="nav-label">Au jour le jour</div>
          {NAV_VENDEUSE.map(renderItem)}
        </>
      )}

      <div className="nav-label">Besoin d&apos;aide</div>
      {renderItem(AIDE)}

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
