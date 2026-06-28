// Garde d'accès : vérifie le cookie de session (JWT) sur l'edge.
// Ne touche jamais la base de données ici — uniquement la vérification du jeton.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length > 0) return new TextEncoder().encode(fromEnv);
  // Repli uniquement pour le développement local — voir lib/auth.ts.
  return new TextEncoder().encode("dev-only-insecure-secret-do-not-use-in-prod");
}

async function lireRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

// Pages autorisées à une vendeuse (rôle limité). Tout le reste — marges, argent, dépenses,
// commissions, contrôle, équipe, tableau de bord — est réservé au propriétaire.
const VENDEUSE_OK = ["/ventes", "/stock"];

function autorise(role: string, pathname: string): boolean {
  if (role === "proprietaire") return true; // accès complet
  return VENDEUSE_OK.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Déjà sur la page de connexion : laisser passer.
  if (pathname === "/connexion") return NextResponse.next();

  const role = await lireRole(req.cookies.get("session")?.value);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  // Connectée mais sans droit sur cette page : on renvoie la vendeuse vers sa caisse.
  if (!autorise(role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/ventes";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Exclut /_next, les fichiers statiques (avec extension), et /connexion.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|connexion|.*\\..*).*)"],
};
