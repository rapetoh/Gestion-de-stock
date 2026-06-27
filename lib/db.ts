// Data layer — built on Node's built-in SQLite (node:sqlite).
// Kept deliberately small and abstracted: feature code never touches SQL directly,
// it goes through the repositories in lib/repo/*. Swapping to hosted SQLite (Turso)
// or Postgres later means reimplementing only this file + the repos.
//
// Money is stored as INTEGER francs CFA (no decimals — the currency has no cents).

import fs from "node:fs";
import path from "node:path";

// Load the built-in SQLite via process.getBuiltinModule — the bundler-proof way to
// reach a Node core module. A static `import ... from "node:sqlite"` gets re-externalized
// into a bare `require()` on hot-reload ("require is not defined"), and
// `createRequire(import.meta.url)("node:sqlite")` makes Turbopack choke on the file:// URL
// reference ("Unsupported external type Url for commonjs reference"). getBuiltinModule is a
// plain property access Turbopack never tries to transform, stable in dev and build alike.
const { DatabaseSync } = process.getBuiltinModule(
  "node:sqlite"
) as typeof import("node:sqlite");
type DatabaseSync = import("node:sqlite").DatabaseSync;

const DB_PATH =
  process.env.MABOUTIQUE_DB ?? path.join(process.cwd(), "data", "maboutique.db");

// In dev, Next reloads modules; reuse a single connection across reloads.
const globalForDb = globalThis as unknown as { __maboutiqueDb?: DatabaseSync };

function connect(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new DatabaseSync(DB_PATH);
  // busy_timeout first, so the lock-sensitive pragmas/migrate below wait instead of failing
  // instantly when several processes touch the same file at once — e.g. `next build`'s
  // parallel page-data workers, or a dev server running alongside a one-off script.
  conn.exec("PRAGMA busy_timeout = 5000;");
  conn.exec("PRAGMA journal_mode = WAL;");
  conn.exec("PRAGMA foreign_keys = ON;");
  migrate(conn);
  return conn;
}

// Connection is opened lazily on first query — NOT at module import. Importing a repo
// (which happens for every page during `next build`'s page-data collection) must not open
// or migrate the database, or 13 build workers race on the file and it locks.
let cached: DatabaseSync | undefined = globalForDb.__maboutiqueDb;
function getDb(): DatabaseSync {
  if (cached) return cached;
  cached = connect();
  if (process.env.NODE_ENV !== "production") globalForDb.__maboutiqueDb = cached;
  return cached;
}

// Exposed for the rare direct user (e.g. scripts/seed.ts). A Proxy keeps the lazy behavior
// while presenting the same `db.prepare(...)` / `db.exec(...)` surface as before.
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

// --- tiny typed helpers -----------------------------------------------------

// node:sqlite returns rows as null-prototype objects. React Server Components
// refuse to pass those across the server→client boundary, so we normalize every
// row to a plain object here (one place) — feature code always gets plain objects.
export function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return (db.prepare(sql).all(...(params as never[])) as Record<string, unknown>[]).map(
    (r) => ({ ...r }) as T
  );
}

export function one<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  const r = db.prepare(sql).get(...(params as never[])) as Record<string, unknown> | undefined;
  return r ? ({ ...r } as T) : undefined;
}

export function run(sql: string, ...params: unknown[]): { lastId: number; changes: number } {
  const r = db.prepare(sql).run(...(params as never[]));
  return { lastId: Number(r.lastInsertRowid), changes: Number(r.changes) };
}

export function tx<T>(fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

// --- schema -----------------------------------------------------------------

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS utilisateur (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nom           TEXT    NOT NULL,
      login         TEXT    NOT NULL UNIQUE,
      mot_de_passe  TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'proprietaire', -- 'proprietaire' | 'vendeuse'
      actif         INTEGER NOT NULL DEFAULT 1,
      cree_le       TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS produit (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nom           TEXT    NOT NULL,
      categorie     TEXT,
      prix_achat    INTEGER NOT NULL DEFAULT 0, -- prix d'achat unitaire pur (hors frais)
      frais         INTEGER NOT NULL DEFAULT 0, -- frais de transport unitaire (frais du lot / quantité)
      prix_vente    INTEGER NOT NULL DEFAULT 0, -- coût de revient = prix_achat + frais ; marge = prix_vente - (prix_achat + frais)
      stock         INTEGER NOT NULL DEFAULT 0,
      seuil_stock   INTEGER NOT NULL DEFAULT 0,
      code_barre    TEXT,
      actif         INTEGER NOT NULL DEFAULT 1,
      cree_le       TEXT    NOT NULL,
      maj_le        TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_produit_nom ON produit(nom);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_produit_code ON produit(code_barre) WHERE code_barre IS NOT NULL;

    CREATE TABLE IF NOT EXISTS achat (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id    INTEGER NOT NULL REFERENCES produit(id),
      quantite      INTEGER NOT NULL,
      prix_achat    INTEGER NOT NULL, -- prix d'achat unitaire (hors frais)
      frais         INTEGER NOT NULL DEFAULT 0, -- frais de transport pour tout le lot
      prix_vente    INTEGER NOT NULL,
      fournisseur   TEXT,
      note          TEXT,
      date          TEXT    NOT NULL,
      user_id       INTEGER REFERENCES utilisateur(id)
    );
    CREATE INDEX IF NOT EXISTS idx_achat_date ON achat(date);
    CREATE INDEX IF NOT EXISTS idx_achat_produit ON achat(produit_id);

    CREATE TABLE IF NOT EXISTS vente (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      date          TEXT    NOT NULL,
      paiement      TEXT    NOT NULL, -- 'especes' | 'tmoney' | 'flooz' | 'credit'
      total         INTEGER NOT NULL,
      note          TEXT,
      user_id       INTEGER REFERENCES utilisateur(id)
    );
    CREATE INDEX IF NOT EXISTS idx_vente_date ON vente(date);

    CREATE TABLE IF NOT EXISTS ligne_vente (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      vente_id      INTEGER NOT NULL REFERENCES vente(id) ON DELETE CASCADE,
      produit_id    INTEGER REFERENCES produit(id),
      nom_produit   TEXT    NOT NULL, -- snapshot, survives product edits
      quantite      INTEGER NOT NULL,
      prix_unitaire INTEGER NOT NULL, -- prix de vente unitaire (snapshot)
      cout_unitaire INTEGER NOT NULL DEFAULT 0, -- prix d'achat unitaire pur (snapshot)
      frais_unitaire INTEGER NOT NULL DEFAULT 0, -- frais de transport unitaire (snapshot)
      total         INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ligne_vente_vente ON ligne_vente(vente_id);
    CREATE INDEX IF NOT EXISTS idx_ligne_vente_produit ON ligne_vente(produit_id);

    CREATE TABLE IF NOT EXISTS mouvement_stock (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id    INTEGER NOT NULL REFERENCES produit(id),
      type          TEXT    NOT NULL, -- 'achat' | 'vente' | 'controle' | 'correction'
      quantite      INTEGER NOT NULL, -- signed: +entrée / -sortie
      stock_avant   INTEGER NOT NULL,
      stock_apres   INTEGER NOT NULL,
      raison        TEXT,
      ref_id        INTEGER, -- id of the achat/vente/controle that caused it
      user_id       INTEGER REFERENCES utilisateur(id),
      date          TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mvt_produit ON mouvement_stock(produit_id);
    CREATE INDEX IF NOT EXISTS idx_mvt_date ON mouvement_stock(date);

    CREATE TABLE IF NOT EXISTS controle_stock (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      date          TEXT    NOT NULL,
      note          TEXT,
      user_id       INTEGER REFERENCES utilisateur(id)
    );

    CREATE TABLE IF NOT EXISTS ligne_controle (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      controle_id   INTEGER NOT NULL REFERENCES controle_stock(id) ON DELETE CASCADE,
      produit_id    INTEGER NOT NULL REFERENCES produit(id),
      theorique     INTEGER NOT NULL,
      compte        INTEGER NOT NULL,
      ecart         INTEGER NOT NULL,
      valeur_ecart  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS compte (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nom           TEXT    NOT NULL,
      type          TEXT    NOT NULL, -- 'especes' | 'tmoney' | 'flooz' | 'credit'
      actif         INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS solde_journalier (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      compte_id     INTEGER NOT NULL REFERENCES compte(id),
      date          TEXT    NOT NULL,
      solde         INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS depense (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      libelle       TEXT    NOT NULL,
      montant       INTEGER NOT NULL,
      categorie     TEXT,
      recurrente    INTEGER NOT NULL DEFAULT 0,
      date          TEXT    NOT NULL,
      user_id       INTEGER REFERENCES utilisateur(id)
    );
    CREATE INDEX IF NOT EXISTS idx_depense_date ON depense(date);
  `);
}
