import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { exporterBase } from "@/lib/db";
import { produitsCsv, ventesCsv, depensesCsv } from "@/lib/repo/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  // Défense en profondeur : le middleware protège déjà, on revérifie ici.
  const session = await getSession();
  if (!session) return new Response("Non autorisé", { status: 401 });

  const type = new URL(req.url).searchParams.get("type") ?? "db";
  const today = new Date().toISOString().slice(0, 10);

  if (type === "db") {
    const dest = path.join(os.tmpdir(), `maboutique-${today}-${process.pid}-${process.hrtime.bigint()}.db`);
    try {
      exporterBase(dest); // snapshot cohérent de toute la base
      const buf = fs.readFileSync(dest);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="ma-boutique-sauvegarde-${today}.db"`,
        },
      });
    } finally {
      try {
        fs.rmSync(dest, { force: true });
      } catch {
        /* fichier temporaire : ignore */
      }
    }
  }

  let csv: string;
  let nom: string;
  if (type === "produits") {
    csv = produitsCsv();
    nom = `produits-${today}.csv`;
  } else if (type === "ventes") {
    csv = ventesCsv();
    nom = `ventes-${today}.csv`;
  } else if (type === "depenses") {
    csv = depensesCsv();
    nom = `depenses-${today}.csv`;
  } else {
    return new Response("Type inconnu", { status: 400 });
  }

  // ﻿ (BOM) pour qu'Excel lise correctement les accents.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}"`,
    },
  });
}
