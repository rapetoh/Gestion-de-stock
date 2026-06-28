import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "./helpers";
import { run } from "../lib/db";
import {
  reconciliationDuJour,
  enregistrerReconciliation,
  historiqueReconciliations,
} from "../lib/repo/comptes";

beforeEach(resetDb);

function compte(nom: string, type: string): number {
  return run("INSERT INTO compte (nom, type, actif) VALUES (?,?,1)", nom, type).lastId;
}

describe("soldes — réconciliation quotidienne", () => {
  it("chiffre l'écart par compte et au total (manque)", () => {
    const esp = compte("Espèces", "especes");
    const tm = compte("TMoney", "tmoney");
    enregistrerReconciliation({
      jour: "2026-06-27",
      lignes: [
        { compteId: esp, attendu: 50000, compte: 45000 }, // manque 5000
        { compteId: tm, attendu: 120000, compte: 120000 }, // juste
      ],
    });

    const reco = reconciliationDuJour("2026-06-27");
    expect(reco.lignes.find((l) => l.compte_id === esp)).toMatchObject({
      attendu: 50000,
      compte: 45000,
      ecart: -5000,
    });
    expect(reco.totaux).toEqual({
      attendu: 170000,
      compte: 165000,
      ecart: -5000,
      comptes: 2,
    });
  });

  it("ré-enregistrer le même jour remplace (un seul solde par compte/jour)", () => {
    const esp = compte("Espèces", "especes");
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: esp, attendu: 50000, compte: 45000 }] });
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: esp, attendu: 50000, compte: 50000 }] });

    const reco = reconciliationDuJour("2026-06-27");
    expect(reco.lignes.find((l) => l.compte_id === esp)).toMatchObject({ compte: 50000, ecart: 0 });
    expect(historiqueReconciliations()).toHaveLength(1); // un seul jour
  });

  it("reporte le dernier attendu connu sur un jour non encore compté", () => {
    const esp = compte("Espèces", "especes");
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: esp, attendu: 50000, compte: 50000 }] });

    const lendemain = reconciliationDuJour("2026-06-28");
    const ligne = lendemain.lignes.find((l) => l.compte_id === esp)!;
    expect(ligne.attendu).toBe(50000); // reporté
    expect(ligne.compte).toBeNull(); // pas encore compté
    expect(lendemain.totaux.comptes).toBe(0);
  });

  it("historique groupé par jour, plus récent en premier", () => {
    const esp = compte("Espèces", "especes");
    enregistrerReconciliation({ jour: "2026-06-26", lignes: [{ compteId: esp, attendu: 100000, compte: 98000 }] });
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: esp, attendu: 100000, compte: 100000 }] });

    const h = historiqueReconciliations();
    expect(h.map((x) => x.jour)).toEqual(["2026-06-27", "2026-06-26"]);
    expect(h[1].ecart).toBe(-2000);
  });

  it("refuse une réconciliation sans aucun solde compté", () => {
    expect(() => enregistrerReconciliation({ jour: "2026-06-27", lignes: [] })).toThrow();
  });

  it("calcule l'attendu : dernier compté + ventes du compte − dépenses (espèces)", () => {
    const esp = compte("Espèces", "especes");
    // Hier : caisse comptée à 50 000.
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: esp, attendu: 50000, compte: 50000 }] });
    // Une vente AVANT/SUR le jour compté ne doit PAS recompter (déjà dans le solde).
    run("INSERT INTO vente (date, paiement, total) VALUES (?,?,?)", "2026-06-27T16:00:00.000Z", "especes", 9999);
    // Aujourd'hui : 8 000 de ventes espèces et 2 000 de dépense sortie de caisse.
    run("INSERT INTO vente (date, paiement, total) VALUES (?,?,?)", "2026-06-28T10:00:00.000Z", "especes", 8000);
    run("INSERT INTO vente (date, paiement, total) VALUES (?,?,?)", "2026-06-28T10:30:00.000Z", "tmoney", 5000); // autre compte, ignoré
    run("INSERT INTO depense (libelle, montant, date) VALUES (?,?,?)", "Transport", 2000, "2026-06-28T11:00:00.000Z");

    const ligne = reconciliationDuJour("2026-06-28").lignes.find((l) => l.compte_id === esp)!;
    expect(ligne.attendu).toBe(56000); // 50000 + 8000 − 2000 (la vente du 27 et le tmoney sont exclus)
    expect(ligne.compte).toBeNull();
    expect(ligne.detail).toMatchObject({ baseline: 50000, ventes: 8000, depenses: 2000 });
  });

  it("attendu TMoney = dernier compté + ventes TMoney (pas de dépenses retirées)", () => {
    const tm = compte("TMoney", "tmoney");
    enregistrerReconciliation({ jour: "2026-06-27", lignes: [{ compteId: tm, attendu: 100000, compte: 100000 }] });
    run("INSERT INTO vente (date, paiement, total) VALUES (?,?,?)", "2026-06-28T09:00:00.000Z", "tmoney", 5000);
    run("INSERT INTO depense (libelle, montant, date) VALUES (?,?,?)", "Loyer", 3000, "2026-06-28T09:00:00.000Z");

    const ligne = reconciliationDuJour("2026-06-28").lignes.find((l) => l.compte_id === tm)!;
    expect(ligne.attendu).toBe(105000); // dépense non retirée d'un compte mobile
  });

  it("premier jour sans comptage : attendu = ventes − dépenses depuis zéro", () => {
    const esp = compte("Espèces", "especes");
    run("INSERT INTO vente (date, paiement, total) VALUES (?,?,?)", "2026-06-27T10:00:00.000Z", "especes", 3000);
    const ligne = reconciliationDuJour("2026-06-27").lignes.find((l) => l.compte_id === esp)!;
    expect(ligne.attendu).toBe(3000);
    expect(ligne.detail).toMatchObject({ baseline: 0, baselineJour: null });
  });
});
