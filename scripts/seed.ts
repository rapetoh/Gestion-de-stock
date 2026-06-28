// Seed realistic demo data (the owner's actual product mix) and validate the schema.
// Run: npm run db:seed
import bcrypt from "bcryptjs";
import { db, run, one, nowIso } from "../lib/db";

function clear() {
  for (const t of [
    "activite",
    "ligne_vente", "vente", "achat", "mouvement_stock",
    "ligne_controle", "controle_stock", "solde_journalier",
    "depense", "commission", "compte", "produit", "utilisateur",
  ]) {
    db.exec(`DELETE FROM ${t};`);
    db.exec(`DELETE FROM sqlite_sequence WHERE name='${t}';`);
  }
}

function seed() {
  clear();
  const now = nowIso();

  // Owner — mot de passe depuis l'environnement, repli "maman2026" pour le dev seulement.
  const login = process.env.OWNER_LOGIN || "maman";
  const motDePasse = process.env.OWNER_INITIAL_PASSWORD || "maman2026";
  const hash = bcrypt.hashSync(motDePasse, 10);
  run(
    `INSERT INTO utilisateur (nom, login, mot_de_passe, role, actif, cree_le)
     VALUES (?,?,?,?,1,?)`,
    "Maman", login, hash, "proprietaire", now
  );

  // Comptes (money buckets for reconciliation)
  for (const [nom, type] of [
    ["Espèces (caisse)", "especes"],
    ["TMoney", "tmoney"],
    ["Flooz", "flooz"],
    ["Crédit", "credit"],
  ]) {
    run(`INSERT INTO compte (nom, type, actif) VALUES (?,?,1)`, nom, type);
  }

  // Products: nom, categorie, prixAchatUnitaire, fraisLot, qte(for cost calc), prixVente, stock, seuil
  const produits: [string, string, number, number, number, number, number, number][] = [
    ["Eau minérale Awa (carton)", "Eau", 1350, 3000, 20, 2000, 3, 5],
    ["Eau en sachet (paquet)", "Eau", 300, 0, 100, 500, 22, 10],
    ["Savon Paris — amande", "Cosmétique", 450, 1500, 50, 750, 1, 4],
    ["Savon Paris — fleur de coton", "Cosmétique", 450, 1500, 50, 750, 18, 4],
    ["Déodorant Nivea Homme", "Cosmétique", 900, 1500, 12, 1500, 2, 3],
    ["Lait concentré (boîte)", "Alimentation", 350, 2000, 48, 500, 9, 6],
    ["Draps importés (Chine)", "Maison", 9000, 12000, 10, 15000, 7, 2],
    ["Canette soda (palette)", "Boisson", 250, 1000, 24, 500, 14, 6],
    ["Liqueur (assortiment)", "Boisson", 3000, 2000, 12, 4000, 5, 3],
  ];

  for (const [nom, cat, pa, frais, qte, pv, stock, seuil] of produits) {
    const fraisUnit = Math.round(frais / qte); // transport per unit
    run(
      `INSERT INTO produit (nom, categorie, prix_achat, frais, prix_vente, stock, seuil_stock, actif, cree_le, maj_le)
       VALUES (?,?,?,?,?,?,?,1,?,?)`,
      nom, cat, pa, fraisUnit, pv, stock, seuil, now, now
    );
  }

  // A couple of demo sales so the dashboard/bénéfices have content
  const espece = "especes";
  const v1 = run(`INSERT INTO vente (date, paiement, total, user_id) VALUES (?,?,?,1)`, now, espece, 6250).lastId;
  // lines: nom, qte, prix_vente, prix_achat(cout), frais_unit, total
  const lignes: [number, string, number, number, number, number, number][] = [
    [1, "Eau minérale Awa (carton)", 2, 2000, 1350, 150, 4000],
    [2, "Eau en sachet (paquet)", 3, 500, 300, 0, 1500],
    [3, "Savon Paris — amande", 1, 750, 450, 30, 750],
  ];
  for (const [pid, nom2, q, pv, cout, frais, tot] of lignes) {
    run(`INSERT INTO ligne_vente (vente_id, produit_id, nom_produit, quantite, prix_unitaire, cout_unitaire, frais_unitaire, total)
         VALUES (?,?,?,?,?,?,?,?)`, v1, pid, nom2, q, pv, cout, frais, tot);
  }

  const counts = {
    produits: one<{ c: number }>("SELECT COUNT(*) c FROM produit")?.c,
    comptes: one<{ c: number }>("SELECT COUNT(*) c FROM compte")?.c,
    ventes: one<{ c: number }>("SELECT COUNT(*) c FROM vente")?.c,
    users: one<{ c: number }>("SELECT COUNT(*) c FROM utilisateur")?.c,
  };
  console.log("Seed OK:", counts);
}

seed();
