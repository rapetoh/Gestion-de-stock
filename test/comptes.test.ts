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
});
