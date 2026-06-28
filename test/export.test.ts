import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resetDb } from "./helpers";
import { createProduit } from "../lib/repo/produits";
import { createVente } from "../lib/repo/ventes";
import { createDepense } from "../lib/repo/depenses";
import { produitsCsv, ventesCsv, depensesCsv } from "../lib/repo/export";
import { exporterBase } from "../lib/db";

beforeEach(resetDb);

describe("export CSV", () => {
  it("produitsCsv : en-tête + lignes", () => {
    createProduit({ nom: "Savon Paris", prixAchat: 100, frais: 20, prixVente: 200, stock: 5 });
    const csv = produitsCsv();
    // En-tête = mêmes colonnes/ordre que l'import (aller-retour export → ré-import).
    expect(csv.split("\r\n")[0]).toBe("Nom;Prix d'achat;Frais;Prix de vente;Stock;Seuil;Catégorie");
    expect(csv).toContain("Savon Paris");
    expect(csv).toContain("200");
  });

  it("ventesCsv : une ligne par produit vendu", () => {
    const pid = createProduit({ nom: "Eau", prixAchat: 100, frais: 0, prixVente: 150, stock: 10 });
    createVente({ paiement: "especes", lignes: [{ produitId: pid, quantite: 2 }] });
    const csv = ventesCsv();
    expect(csv).toContain("Eau");
    expect(csv).toContain("especes");
  });

  it("depensesCsv : liste les dépenses", () => {
    createDepense({ libelle: "Loyer", montant: 30000, categorie: "Loyer", date: "2026-06-01" });
    expect(depensesCsv()).toContain("Loyer");
  });

  it("échappe les caractères spéciaux (guillemets, point-virgule)", () => {
    createProduit({ nom: 'Lait "spécial"; gros', prixAchat: 1, frais: 0, prixVente: 2, stock: 1 });
    expect(produitsCsv()).toContain('"Lait ""spécial""; gros"');
  });
});

describe("sauvegarde complète", () => {
  it("exporterBase écrit un vrai fichier SQLite, restituable", () => {
    createProduit({ nom: "Test", prixAchat: 1, frais: 0, prixVente: 2, stock: 3 });
    const dest = path.join(os.tmpdir(), `test-backup-${process.hrtime.bigint()}.db`);
    try {
      exporterBase(dest);
      expect(fs.existsSync(dest)).toBe(true);
      expect(fs.statSync(dest).size).toBeGreaterThan(0);

      const { DatabaseSync } = process.getBuiltinModule(
        "node:sqlite"
      ) as typeof import("node:sqlite");
      const copy = new DatabaseSync(dest);
      const row = copy.prepare("SELECT COUNT(*) AS n FROM produit").get() as { n: number };
      copy.close();
      expect(row.n).toBe(1);
    } finally {
      fs.rmSync(dest, { force: true });
    }
  });
});
