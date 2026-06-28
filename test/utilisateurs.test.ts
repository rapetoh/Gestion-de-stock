import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, creerUser } from "./helpers";
import {
  creerVendeuse,
  listUtilisateurs,
  loginExiste,
  definirActif,
  reinitialiserMotDePasse,
} from "../lib/repo/utilisateurs";

beforeEach(resetDb);

describe("utilisateurs — comptes vendeuse", () => {
  it("crée une vendeuse avec le rôle limité", () => {
    const res = creerVendeuse({ nom: "Akossiwa", login: "akossiwa", motDePasse: "1234" });
    expect(res.ok).toBe(true);
    const u = listUtilisateurs().find((x) => x.login === "akossiwa")!;
    expect(u.role).toBe("vendeuse");
    expect(u.actif).toBe(1);
  });

  it("refuse un identifiant déjà pris (insensible à la casse)", () => {
    creerVendeuse({ nom: "A", login: "ama", motDePasse: "1234" });
    const dup = creerVendeuse({ nom: "B", login: "AMA", motDePasse: "1234" });
    expect(dup.ok).toBe(false);
    expect(loginExiste("Ama")).toBe(true);
  });

  it("refuse un mot de passe trop court ou un nom/login vide", () => {
    expect(creerVendeuse({ nom: "A", login: "a", motDePasse: "12" }).ok).toBe(false);
    expect(creerVendeuse({ nom: "", login: "a", motDePasse: "1234" }).ok).toBe(false);
    expect(creerVendeuse({ nom: "A", login: "", motDePasse: "1234" }).ok).toBe(false);
  });

  it("désactive puis réactive une vendeuse, mais jamais le propriétaire", () => {
    const proprio = creerUser("Maman"); // rôle propriétaire
    const r = creerVendeuse({ nom: "V", login: "v", motDePasse: "1234" });
    const vid = (r as { ok: true; id: number }).id;

    definirActif(vid, false);
    expect(listUtilisateurs().find((x) => x.id === vid)!.actif).toBe(0);
    definirActif(vid, true);
    expect(listUtilisateurs().find((x) => x.id === vid)!.actif).toBe(1);

    expect(() => definirActif(proprio, false)).toThrow();
  });

  it("réinitialise le mot de passe d'une vendeuse", () => {
    const r = creerVendeuse({ nom: "V", login: "v", motDePasse: "1234" });
    const vid = (r as { ok: true; id: number }).id;
    expect(reinitialiserMotDePasse(vid, "9999").ok).toBe(true);
    expect(reinitialiserMotDePasse(vid, "1").ok).toBe(false); // trop court
  });
});
