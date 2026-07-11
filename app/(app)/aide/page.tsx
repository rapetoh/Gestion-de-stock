import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Topic = {
  titre: string;
  corps: ReactNode;
  lien?: { href: string; label: string };
};

const OWNER: Topic[] = [
  {
    titre: "Vendre — encaisser un client",
    corps: (
      <>
        <p>
          Va dans <strong>Ventes</strong>. Tape le nom du produit, mets la
          quantité, choisis comment le client paie (espèces, TMoney, Flooz ou
          crédit), puis <strong>Encaisser</strong>.
        </p>
        <p>
          Pas besoin d&apos;ouvrir une caisse. Le stock baisse tout seul. Pour un{" "}
          <strong>crédit</strong>, la marchandise sort mais l&apos;argent
          n&apos;est pas encore reçu — note bien qui te doit.
        </p>
      </>
    ),
    lien: { href: "/ventes", label: "Ouvrir Ventes" },
  },
  {
    titre: "Ajouter ou importer mes produits",
    corps: (
      <>
        <p>
          Dans <strong>Produits</strong>, tu ajoutes un article (nom, prix
          d&apos;achat, prix de vente, stock).
        </p>
        <p>
          Tu as une longue liste ? Va dans <strong>Produits → Importer</strong> :
          enregistre ta feuille Excel en <strong>CSV</strong>, charge-la, dis
          quelle colonne est le Nom, le Prix, le Stock, et vérifie
          l&apos;aperçu avant d&apos;enregistrer. Seul le <strong>Nom</strong> est
          obligatoire.
        </p>
      </>
    ),
    lien: { href: "/produits/import", label: "Importer une liste" },
  },
  {
    titre: "Enregistrer un achat (ravitaillement)",
    corps: (
      <>
        <p>
          Quand tu ramènes de la marchandise du marché ou d&apos;un fournisseur,
          va dans <strong>Achats</strong>. Choisis (ou crée) le produit, mets la
          quantité, le prix d&apos;achat et les frais de transport du lot.
        </p>
        <p>Le stock monte tout seul. Tu pourras toujours corriger après.</p>
      </>
    ),
    lien: { href: "/achats", label: "Ouvrir Achats" },
  },
  {
    titre: "Contrôle de stock — trouver les manques (anti-vol)",
    corps: (
      <>
        <p>
          Va dans <strong>Contrôle de stock</strong>, compte ce qu&apos;il y a
          vraiment sur l&apos;étagère, et l&apos;app compare avec ce qu&apos;elle
          attendait. S&apos;il manque des choses, elle te le montre en{" "}
          <strong>F CFA</strong> — c&apos;est peut-être une perte ou un vol.
        </p>
        <p>
          Fais-le régulièrement, et une grande fois <strong>avec ta vendeuse</strong>{" "}
          avant qu&apos;elle parte, pour partir d&apos;un stock juste.
        </p>
      </>
    ),
    lien: { href: "/controle", label: "Ouvrir Contrôle de stock" },
  },
  {
    titre: "Soldes du jour — est-ce que tout l'argent est là ?",
    corps: (
      <>
        <p>
          Chaque soir, vérifie ton argent : la <strong>caisse</strong>, le solde{" "}
          <strong>TMoney</strong>, le solde <strong>Flooz</strong>. L&apos;app
          calcule ce qui est attendu (dernier comptage + ventes − dépenses) et te
          dit si ça colle.
        </p>
        <p>
          Un manque qui revient = de l&apos;argent qui sort sans être noté.
        </p>
      </>
    ),
    lien: { href: "/soldes", label: "Ouvrir Soldes du jour" },
  },
  {
    titre: "Commissions Mobile Money",
    corps: (
      <p>
        Note ici ce que tu gagnes sur <strong>TMoney</strong> et{" "}
        <strong>Flooz</strong> (les commissions). Ça s&apos;ajoute à ton vrai
        bénéfice du mois.
      </p>
    ),
    lien: { href: "/commissions", label: "Ouvrir Commissions" },
  },
  {
    titre: "Dépenses",
    corps: (
      <>
        <p>
          Note tes dépenses : loyer, salaire, transport, taxes… Coche{" "}
          <strong>« revient chaque mois »</strong> pour le loyer ou le salaire :
          tu ne le tapes qu&apos;une fois et l&apos;app le compte les mois
          suivants.
        </p>
        <p>Les dépenses se retirent de ton bénéfice.</p>
      </>
    ),
    lien: { href: "/depenses", label: "Ouvrir Dépenses" },
  },
  {
    titre: "Bénéfices — combien je gagne vraiment",
    corps: (
      <p>
        Le tableau qui compte : recette − coût de la marchandise, +
        commissions − dépenses = ta <strong>marge réelle</strong> du mois. Choisis
        le mois en haut de la page.
      </p>
    ),
    lien: { href: "/benefices", label: "Ouvrir Bénéfices" },
  },
  {
    titre: "Ma vendeuse (Équipe)",
    corps: (
      <>
        <p>
          Donne à ta vendeuse son <strong>propre code</strong> dans Équipe. Chaque
          vente portera son nom, et elle ne touche ni aux marges, ni à
          l&apos;argent, ni aux suppressions.
        </p>
        <p>
          Si elle part, tu la <strong>désactives</strong> (jamais supprimée : son
          historique reste à son nom).
        </p>
      </>
    ),
    lien: { href: "/equipe", label: "Ouvrir Équipe" },
  },
  {
    titre: "Sauvegarde — ne jamais rien perdre",
    corps: (
      <p>
        Va dans <strong>Sauvegarde</strong> et télécharge une copie de toute ta
        boutique. Range-la en lieu sûr (clé USB, e-mail, Google Drive). Si
        l&apos;ordinateur tombe en panne, rien n&apos;est perdu. Fais-le chaque
        fin de semaine.
      </p>
    ),
    lien: { href: "/sauvegarde", label: "Ouvrir Sauvegarde" },
  },
  {
    titre: "Activité — qui a fait quoi",
    corps: (
      <p>
        Le journal de qui a fait quoi, et à quelle heure : ventes,
        modifications, suppressions, contrôles, connexions. Pratique pour
        comprendre ce qui s&apos;est passé un jour donné.
      </p>
    ),
    lien: { href: "/activite", label: "Ouvrir Activité" },
  },
  {
    titre: "Si tu es bloquée",
    corps: (
      <>
        <p>
          Respire — rien ne se casse facilement, presque tout se corrige. Tu peux
          modifier ou supprimer une vente, un achat, un produit.
        </p>
        <p>
          Si tu ne retrouves plus ton mot de passe ou qu&apos;un chiffre te semble
          bizarre, appelle Roch au <strong>+1&nbsp;319-320-8147</strong>. Et pense
          à faire une <strong>Sauvegarde</strong> de temps en temps : c&apos;est
          ta ceinture de sécurité.
        </p>
      </>
    ),
  },
];

const VENDEUSE: Topic[] = [
  {
    titre: "Vendre — encaisser un client",
    corps: (
      <>
        <p>
          Va dans <strong>Ventes</strong>. Tape le nom du produit, mets la
          quantité, choisis comment le client paie (espèces, TMoney, Flooz ou
          crédit), puis <strong>Encaisser</strong>.
        </p>
        <p>
          Le stock baisse tout seul. Pour un <strong>crédit</strong>, note bien
          qui doit l&apos;argent.
        </p>
      </>
    ),
    lien: { href: "/ventes", label: "Ouvrir Ventes" },
  },
  {
    titre: "Voir le stock",
    corps: (
      <p>
        Dans <strong>Stock</strong>, tu vois ce qu&apos;il reste sur les
        étagères. Un article en rouge est fini ou presque fini — préviens la
        propriétaire pour qu&apos;elle recommande.
      </p>
    ),
    lien: { href: "/stock", label: "Ouvrir Stock" },
  },
  {
    titre: "Si tu es bloquée",
    corps: (
      <p>
        Pas de panique. Si tu ne peux plus te connecter ou qu&apos;un truc
        cloche, préviens la propriétaire. Tu ne peux pas casser
        l&apos;application.
      </p>
    ),
  },
];

export default async function AidePage() {
  const session = await getSession();
  const proprietaire = session?.role === "proprietaire";
  const topics = proprietaire ? OWNER : VENDEUSE;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Aide</h1>
          <div className="when">
            Tout en mots simples. Clique sur une question pour voir la réponse.
          </div>
        </div>
        <div className="right">
          <Link className="btn ghost" href="/?guide=1">
            ▶ Revoir le guide de départ
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="aide">
        {topics.map((t) => (
          <details className="card aide-item" key={t.titre}>
            <summary>{t.titre}</summary>
            <div className="aide-body">
              {t.corps}
              {t.lien ? (
                <p>
                  <Link className="lien" href={t.lien.href}>
                    {t.lien.label} →
                  </Link>
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
