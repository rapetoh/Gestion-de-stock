import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, creerUser } from "./helpers";
import { listActivite, journaliser } from "../lib/repo/activite";
import { createProduit } from "../lib/repo/produits";
import { createVente } from "../lib/repo/ventes";
import { createAchat } from "../lib/repo/achats";
import { enregistrerControle } from "../lib/repo/controle";

beforeEach(resetDb);

describe("journal d'activité — qui a fait quoi, et quand", () => {
  it("journalise la création d'une vente avec l'auteur et le montant", () => {
    const uid = creerUser("Maman");
    const pid = createProduit(
      { nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 10 },
      uid
    );
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 1 }], userId: uid });

    const ventes = listActivite({ action: "creation" }).filter((l) => l.entite === "vente");
    expect(ventes).toHaveLength(1);
    expect(ventes[0]).toMatchObject({
      user_id: uid,
      user_nom: "Maman",
      action: "creation",
      entite: "vente",
      montant: 150,
    });
  });

  it("journalise les achats et les contrôles", () => {
    const uid = creerUser("Maman");
    const pid = createProduit({ nom: "Savon", prixAchat: 100, frais: 0, prixVente: 200, stock: 10 });
    createAchat({ produitId: pid, quantite: 5, prixAchat: 100, frais: 0, prixVente: 200, userId: uid });
    enregistrerControle({ lignes: [{ produitId: pid, compte: 12 }], userId: uid });

    const achat = listActivite({ action: "creation" }).find((l) => l.entite === "achat");
    expect(achat).toMatchObject({ entite: "achat", user_id: uid });

    const controle = listActivite({ action: "controle" });
    expect(controle).toHaveLength(1);
    expect(controle[0]).toMatchObject({ entite: "controle", user_id: uid });
  });

  it("renvoie le plus récent en premier et filtre par action", () => {
    journaliser({ action: "connexion", entite: "session", details: "A" });
    journaliser({ action: "connexion", entite: "session", details: "B" });
    const list = listActivite({ action: "connexion" });
    expect(list.map((l) => l.details)).toEqual(["B", "A"]);
  });

  it("est best-effort : journaliser n'échoue jamais en utilisation normale", () => {
    expect(() =>
      journaliser({ action: "creation", entite: "test", details: "ok" })
    ).not.toThrow();
  });
});
