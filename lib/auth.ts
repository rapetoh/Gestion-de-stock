// Authentification — sessions par cookie signé (JWT via jose, vérifiable sur edge).
// On garde tout volontairement simple : un seul cookie "session" httpOnly.
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // ~30 jours

// Le secret vient de l'environnement. En production il est obligatoire ;
// en développement on tolère un secret de repli (clairement marqué).
function getSecret(): Uint8Array {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length > 0) return new TextEncoder().encode(fromEnv);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET manquant en production.");
  }
  // Repli uniquement pour le développement local — NE PAS utiliser en production.
  console.warn(
    "[auth] AUTH_SECRET absent : utilisation d'un secret de développement (non sécurisé)."
  );
  return new TextEncoder().encode("dev-only-insecure-secret-do-not-use-in-prod");
}

export type Session = { userId: number; nom: string; role: string };

export async function createSession(user: Session): Promise<void> {
  const token = await new SignJWT({ ...user } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId === "number" &&
      typeof payload.nom === "string" &&
      typeof payload.role === "string"
    ) {
      return { userId: payload.userId, nom: payload.nom, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
