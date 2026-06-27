import { listProduits } from "@/lib/repo/produits";
import { listAchats } from "@/lib/repo/achats";
import AchatForm from "./AchatForm";
import AchatsRows from "./AchatsRows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AchatsPage() {
  const produits = listProduits();
  const achats = listAchats(20);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Achats</h1>
          <div className="when">
            Enregistre un produit qui arrive — du fournisseur ou du marché.
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "420px 1fr", alignItems: "start" }}
      >
        <div className="card">
          <h2>Enregistrer un achat</h2>
          <div className="hint">
            Tape le nom du produit. S&apos;il existe déjà, il se complète tout
            seul. Sinon il sera créé.
          </div>
          <AchatForm produits={produits} />
        </div>

        <div className="card">
          <h2>Derniers achats</h2>
          <div className="hint">Tout ce qui est entré récemment.</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th className="num">Qté</th>
                <th className="num">Prix d&apos;achat</th>
                <th className="num">Frais</th>
                <th className="num">Prix de vente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {achats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Aucun achat enregistré pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                <AchatsRows achats={achats} />
              )}
            </tbody>
          </table>
          <div className="note">
            Aucun code-barres obligatoire. Tu retrouves tout par le nom.
          </div>
        </div>
      </div>
    </>
  );
}
