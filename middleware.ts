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

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Déjà sur la page de connexion : laisser passer.
  if (pathname === "/connexion") return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (await isValid(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/connexion";
  return NextResponse.redirect(url);
}

export const config = {
  // Exclut /_next, les fichiers statiques (avec extension), et /connexion.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|connexion|.*\\..*).*)"],
};
