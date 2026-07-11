import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";
import AideFiltre from "@/components/AideFiltre";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// L'aide est organisée par QUESTIONS (celles qu'on se pose vraiment en travaillant),
// pas par écrans. Chaque réponse a été vérifiée contre ce que l'app fait réellement —
// quand quelque chose n'existe pas encore (ex : restaurer une sauvegarde soi-même),
// la réponse honnête est « appelle Roch », jamais une invention.

type QA = { q: string; r: ReactNode; lien?: { href: string; label: string } };
type Section = { titre: string; items: QA[] };

const TEL = (
  <>
    Roch au <strong>+1&nbsp;319-320-8147</strong>
  </>
);

const OWNER: Section[] = [
  {
    titre: "Tes produits",
    items: [
      {
        q: "Comment j'ajoute un produit ?",
        r: (
          <p>
            Va dans <strong>Produits</strong> → « Ajouter un produit ». Donne le nom, le
            prix d&apos;achat, le prix de vente et le stock. C&apos;est tout — le
            code-barres et la catégorie sont facultatifs.
          </p>
        ),
        lien: { href: "/produits", label: "Ouvrir Produits" },
      },
      {
        q: "Comment j'importe toute ma liste d'un coup ?",
        r: (
          <p>
            <strong>Produits → Importer</strong> : enregistre ta feuille Excel en{" "}
            <strong>CSV</strong>, charge-la, dis quelle colonne est quoi, et vérifie
            l&apos;aperçu avant d&apos;enregistrer. Seul le nom est obligatoire.
          </p>
        ),
        lien: { href: "/produits/import", label: "Importer une liste" },
      },
      {
        q: "Comment je change le prix (ou le nom, ou le stock) d'un produit ?",
        r: (
          <p>
            <strong>Produits</strong> → cherche-le par son nom → bouton{" "}
            <strong>Modifier</strong> sur sa ligne → corrige → Enregistrer. Rien
            n&apos;est figé.
          </p>
        ),
        lien: { href: "/produits", label: "Ouvrir Produits" },
      },
      {
        q: "Comment je supprime un produit ?",
        r: (
          <p>
            <strong>Produits</strong> → cherche-le → bouton <strong>Supprimer</strong>{" "}
            sur sa ligne, puis confirme. Ses ventes passées restent dans ton historique —
            tu ne perds aucun chiffre.
          </p>
        ),
        lien: { href: "/produits", label: "Ouvrir Produits" },
      },
      {
        q: "Comment je retrouve un produit dans une longue liste ?",
        r: (
          <p>
            Tape un bout de son nom dans la case de recherche en haut de{" "}
            <strong>Produits</strong>. Tu peux aussi filtrer par catégorie ou «&nbsp;stock
            bas&nbsp;», ou scanner son code-barres.
          </p>
        ),
      },
      {
        q: "C'est quoi le « seuil » d'un produit ?",
        r: (
          <p>
            C&apos;est ton niveau d&apos;alerte. Quand le stock descend au seuil (ou en
            dessous), le produit passe en rouge et apparaît dans « À recommander » sur le
            tableau de bord.
          </p>
        ),
      },
      {
        q: "À quoi sert le code-barres ? Il est obligatoire ?",
        r: (
          <p>
            Jamais obligatoire. Si un produit en a un, une douchette (lecteur de
            code-barres) le retrouve instantanément à la caisse, aux achats et au
            contrôle — la douchette « tape » le code à ta place.
          </p>
        ),
      },
    ],
  },
  {
    titre: "Vendre & encaisser",
    items: [
      {
        q: "Comment j'encaisse un client ?",
        r: (
          <p>
            <strong>Ventes</strong> → tape le nom du produit → choisis-le → mets la
            quantité → choisis comment il paie → <strong>Encaisser</strong>. Le stock
            baisse tout seul, pas de caisse à ouvrir.
          </p>
        ),
        lien: { href: "/ventes", label: "Ouvrir Ventes" },
      },
      {
        q: "Le client prend plusieurs produits ?",
        r: (
          <p>
            Ajoute-les un par un dans le panier (la quantité se règle sur chaque ligne),
            puis un seul <strong>Encaisser</strong> pour tout.
          </p>
        ),
      },
      {
        q: "Le client paie par TMoney ou Flooz ?",
        r: (
          <p>
            Choisis le bouton <strong>TMoney</strong> ou <strong>Flooz</strong> avant
            d&apos;encaisser. C&apos;est important : le soir, l&apos;app compare chaque
            caisse (espèces, TMoney, Flooz) séparément.
          </p>
        ),
      },
      {
        q: "Le client n'a pas payé (il prend à crédit) ?",
        r: (
          <p>
            Choisis <strong>Crédit</strong> : la marchandise sort du stock mais
            l&apos;app sait que l&apos;argent n&apos;est pas encore reçu. Note bien qui
            te doit quoi.
          </p>
        ),
      },
      {
        q: "Je me suis trompée sur une vente — je fais quoi ?",
        r: (
          <p>
            <strong>Ventes</strong> → la liste du jour est sous la caisse →{" "}
            <strong>Modifier</strong> pour corriger, ou <strong>Supprimer</strong> pour
            l&apos;annuler (le stock revient tout seul).
          </p>
        ),
        lien: { href: "/ventes", label: "Ouvrir Ventes" },
      },
      {
        q: "Et si l'erreur date d'hier ou d'avant ?",
        r: (
          <p>
            En haut de la liste des ventes, choisis le <strong>jour</strong> avec la case
            date. Tu peux corriger ou supprimer une vente de n&apos;importe quel jour.
          </p>
        ),
      },
      {
        q: "L'app affiche stock 0 mais j'ai le produit en main ?",
        r: (
          <p>
            Vends quand même — la vente passe, l&apos;app te le signale simplement.
            Ensuite, remets le stock d&apos;équerre avec un petit{" "}
            <strong>Contrôle de stock</strong>.
          </p>
        ),
      },
    ],
  },
  {
    titre: "Tu t'es trompée ? Tout se corrige",
    items: [
      {
        q: "J'ai fait une erreur quelque part — c'est grave ?",
        r: (
          <p>
            Non. Presque tout se <strong>modifie</strong> ou se{" "}
            <strong>supprime</strong> : un produit, une vente, un achat, une dépense, une
            commission. Cherche le bouton « Modifier » sur la ligne concernée. Rien ne se
            casse facilement.
          </p>
        ),
      },
      {
        q: "Si je supprime une vente ou un achat, le stock reste faux ?",
        r: (
          <p>
            Non : supprimer une vente <strong>remet</strong> la marchandise en stock,
            supprimer un achat la <strong>retire</strong>. L&apos;app fait le ménage
            derrière toi.
          </p>
        ),
      },
      {
        q: "Est-ce que l'app garde une trace de ce qui a été fait ?",
        r: (
          <p>
            Oui — la page <strong>Activité</strong> montre qui a fait quoi et à quelle
            heure : ventes, modifications, suppressions, contrôles, connexions.
          </p>
        ),
        lien: { href: "/activite", label: "Ouvrir Activité" },
      },
    ],
  },
  {
    titre: "Ton stock",
    items: [
      {
        q: "Comment je vois ce qu'il reste sur les étagères ?",
        r: (
          <p>
            Page <strong>Stock</strong>. En rouge : fini ou presque fini. Le tableau de
            bord te montre aussi « À recommander bientôt ».
          </p>
        ),
        lien: { href: "/stock", label: "Ouvrir Stock" },
      },
      {
        q: "Le stock affiché ne correspond pas à l'étagère ?",
        r: (
          <p>
            Fais un <strong>Contrôle de stock</strong> : compte ce qu&apos;il y a
            vraiment, tape le chiffre, et l&apos;app corrige le stock en te montrant
            l&apos;écart. C&apos;est la façon propre de remettre les compteurs à zéro.
          </p>
        ),
        lien: { href: "/controle", label: "Ouvrir Contrôle de stock" },
      },
      {
        q: "Comment je fais un contrôle de stock ?",
        r: (
          <p>
            <strong>Contrôle de stock</strong> → cherche un produit → tape la quantité
            réellement comptée → l&apos;app compare avec ce qu&apos;elle attendait →{" "}
            <strong>Enregistrer le contrôle</strong>. Tu peux ne compter que quelques
            produits à la fois.
          </p>
        ),
      },
      {
        q: "Le contrôle montre un manque — ça veut dire quoi ?",
        r: (
          <p>
            De la marchandise est sortie sans être notée : perte, casse… ou vol.
            L&apos;app te montre combien ça vaut en F CFA. Fais-le régulièrement — et une
            grande fois avec ta vendeuse avant son départ.
          </p>
        ),
      },
      {
        q: "Je peux revoir mes anciens contrôles ?",
        r: (
          <p>
            Oui — en bas de la page Contrôle, « Contrôles récents » garde chaque contrôle
            avec son écart. Clique dessus pour voir le détail.
          </p>
        ),
      },
    ],
  },
  {
    titre: "Ton argent",
    items: [
      {
        q: "Le soir, comment je vérifie que tout l'argent est là ?",
        r: (
          <p>
            <strong>Soldes du jour</strong> : compte l&apos;argent de la caisse, lis tes
            soldes TMoney et Flooz sur les portables, tape les trois chiffres.
            L&apos;app calcule ce qui était attendu et te dit si ça colle.
          </p>
        ),
        lien: { href: "/soldes", label: "Ouvrir Soldes du jour" },
      },
      {
        q: "Il manque de l'argent dans les soldes du soir ?",
        r: (
          <p>
            Un manque isolé peut être une dépense oubliée ou un crédit non noté — note
            tout et refais le point demain. Un manque qui <strong>revient</strong>,
            c&apos;est de l&apos;argent qui sort sans être noté : creuse.
          </p>
        ),
      },
      {
        q: "Je me suis trompée en tapant les soldes du soir ?",
        r: (
          <p>
            Refais simplement l&apos;enregistrement du même jour : le nouveau{" "}
            <strong>remplace</strong> l&apos;ancien.
          </p>
        ),
      },
      {
        q: "Où je note ce que me rapportent TMoney et Flooz ?",
        r: (
          <p>
            Dans <strong>Commissions</strong>. Ces gains s&apos;ajoutent à ton vrai
            bénéfice du mois. Une commission fausse se modifie ou se supprime sur sa
            ligne.
          </p>
        ),
        lien: { href: "/commissions", label: "Ouvrir Commissions" },
      },
      {
        q: "Où je note le loyer, le salaire, le transport… ?",
        r: (
          <p>
            Dans <strong>Dépenses</strong>. Pour le loyer ou le salaire, coche{" "}
            <strong>« revient chaque mois »</strong> : tu le tapes une fois, l&apos;app
            le compte les mois suivants.
          </p>
        ),
        lien: { href: "/depenses", label: "Ouvrir Dépenses" },
      },
      {
        q: "Combien je gagne vraiment ?",
        r: (
          <p>
            Page <strong>Bénéfices</strong>, choisis le mois en haut. Le calcul :
            recette − coût de la marchandise − dépenses + commissions = ta{" "}
            <strong>marge réelle</strong>.
          </p>
        ),
        lien: { href: "/benefices", label: "Ouvrir Bénéfices" },
      },
    ],
  },
  {
    titre: "Ta vendeuse",
    items: [
      {
        q: "Comment je lui crée son code d'entrée ?",
        r: (
          <p>
            <strong>Équipe</strong> → « Ajouter une vendeuse » : son nom, un identifiant,
            un mot de passe. Chaque vente qu&apos;elle fera portera son nom.
          </p>
        ),
        lien: { href: "/equipe", label: "Ouvrir Équipe" },
      },
      {
        q: "Qu'est-ce qu'elle peut voir et faire ?",
        r: (
          <p>
            Seulement <strong>Ventes</strong> et <strong>Stock</strong>. Elle ne voit ni
            tes marges, ni ton argent, et elle ne peut ni modifier ni supprimer une vente
            — ça, c&apos;est toi seule.
          </p>
        ),
      },
      {
        q: "Elle a oublié son mot de passe ?",
        r: (
          <p>
            <strong>Équipe</strong> → sa ligne → bouton <strong>Mot de passe</strong> →
            donne-lui-en un nouveau. Trente secondes.
          </p>
        ),
      },
      {
        q: "Elle part (ou tu ne veux plus qu'elle entre) ?",
        r: (
          <p>
            <strong>Équipe</strong> → <strong>Désactiver</strong> : elle ne peut plus se
            connecter, mais tout son historique reste à son nom. Tu peux la réactiver
            plus tard si besoin.
          </p>
        ),
      },
    ],
  },
  {
    titre: "Sauvegarde & sécurité",
    items: [
      {
        q: "Comment je fais une copie de secours ?",
        r: (
          <p>
            <strong>Sauvegarde</strong> → « Télécharger une copie de mes données ».
            Range le fichier en lieu sûr (clé USB, e-mail, Google Drive). Fais-le chaque
            fin de semaine — c&apos;est ta ceinture de sécurité.
          </p>
        ),
        lien: { href: "/sauvegarde", label: "Ouvrir Sauvegarde" },
      },
      {
        q: "Je peux ouvrir mes données dans Excel ?",
        r: (
          <p>
            Oui — la page Sauvegarde propose aussi tes produits, ventes, dépenses et
            commissions en <strong>CSV</strong>, lisibles dans Excel.
          </p>
        ),
      },
      {
        q: "Comment je remets une sauvegarde (restaurer) ?",
        r: (
          <p>
            Ça ne se fait pas toute seule depuis l&apos;app : appelle {TEL} — on le fait
            ensemble en cinq minutes, sans rien perdre.
          </p>
        ),
      },
      {
        q: "Comment je change MON mot de passe ?",
        r: (
          <p>
            Pour l&apos;instant, ton mot de passe à toi ne se change pas depuis
            l&apos;app : appelle {TEL}. (Celui de ta vendeuse, si : page Équipe.)
          </p>
        ),
      },
    ],
  },
  {
    titre: "Petits problèmes",
    items: [
      {
        q: "J'ai oublié mon mot de passe ?",
        r: (
          <p>
            Appelle {TEL} — il te le remet. (Ta vendeuse, elle, passe par toi : page
            Équipe → Mot de passe.)
          </p>
        ),
      },
      {
        q: "La page ne répond plus ou s'affiche mal ?",
        r: (
          <p>
            Recharge la page (tire l&apos;écran vers le bas sur téléphone), ou ferme et
            rouvre le navigateur, puis reconnecte-toi. Tes données ne bougent pas.
          </p>
        ),
      },
      {
        q: "Il n'y a plus d'internet ?",
        r: (
          <p>
            L&apos;app a besoin d&apos;internet. En attendant, note tes ventes sur un
            papier, et saisis-les dès que la connexion revient. Rien n&apos;est perdu.
          </p>
        ),
      },
      {
        q: "J'ai perdu ou changé de téléphone ?",
        r: (
          <p>
            Aucune donnée n&apos;est dans le téléphone. Sur n&apos;importe quel appareil,
            ouvre <strong>monpanier.fly.dev</strong>, connecte-toi, et tout est là.
          </p>
        ),
      },
      {
        q: "Un chiffre me paraît bizarre ?",
        r: (
          <p>
            Regarde <strong>Activité</strong> : qui a fait quoi, et quand — souvent la
            réponse y est. Sinon, appelle {TEL}.
          </p>
        ),
        lien: { href: "/activite", label: "Ouvrir Activité" },
      },
      {
        q: "Je suis bloquée, rien ne marche ?",
        r: (
          <p>
            Respire — presque tout se corrige. Appelle {TEL}, à n&apos;importe quelle
            heure raisonnable, et on règle ça ensemble.
          </p>
        ),
      },
    ],
  },
];

const VENDEUSE: Section[] = [
  {
    titre: "Vendre",
    items: [
      {
        q: "Comment j'encaisse un client ?",
        r: (
          <p>
            <strong>Ventes</strong> → tape le nom du produit → choisis-le → quantité →
            comment il paie → <strong>Encaisser</strong>. Le stock baisse tout seul.
          </p>
        ),
        lien: { href: "/ventes", label: "Ouvrir Ventes" },
      },
      {
        q: "Le client prend plusieurs produits ?",
        r: (
          <p>
            Ajoute-les un par un dans le panier, règle les quantités, puis un seul{" "}
            <strong>Encaisser</strong> pour tout.
          </p>
        ),
      },
      {
        q: "Le client paie par TMoney ou Flooz ?",
        r: (
          <p>
            Choisis le bon bouton avant d&apos;encaisser — c&apos;est important pour les
            comptes du soir.
          </p>
        ),
      },
      {
        q: "Le client n'a pas payé (crédit) ?",
        r: (
          <p>
            Choisis <strong>Crédit</strong> et note bien qui doit l&apos;argent.
          </p>
        ),
      },
      {
        q: "Je me suis trompée sur une vente ?",
        r: (
          <p>
            Préviens la propriétaire : elle seule peut corriger ou annuler une vente. Ce
            n&apos;est pas grave, ça se répare.
          </p>
        ),
      },
    ],
  },
  {
    titre: "Le stock",
    items: [
      {
        q: "Comment je vois ce qu'il reste ?",
        r: (
          <p>
            Page <strong>Stock</strong>. En rouge : fini ou presque — préviens la
            propriétaire pour qu&apos;elle recommande.
          </p>
        ),
        lien: { href: "/stock", label: "Ouvrir Stock" },
      },
    ],
  },
  {
    titre: "Petits problèmes",
    items: [
      {
        q: "J'ai oublié mon mot de passe ?",
        r: (
          <p>
            Demande à la propriétaire : elle t&apos;en redonne un depuis sa page Équipe,
            en trente secondes.
          </p>
        ),
      },
      {
        q: "Quelque chose cloche ?",
        r: (
          <p>
            Pas de panique — tu ne peux pas casser l&apos;application. Préviens la
            propriétaire.
          </p>
        ),
      },
    ],
  },
];

export default async function AidePage() {
  const session = await getSession();
  const proprietaire = session?.role === "proprietaire";
  const sections = proprietaire ? OWNER : VENDEUSE;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Aide</h1>
          <div className="when">
            Cherche ta question, clique dessus pour voir la réponse.
          </div>
        </div>
        <div className="right">
          <Link className="btn ghost" href="/?guide=1">
            ▶ Revoir le guide de départ
          </Link>
          <PrintButton />
        </div>
      </div>

      <AideFiltre />

      <div className="aide" id="aide-liste">
        {sections.map((s) => (
          <div key={s.titre} data-section>
            <div className="aide-cat">{s.titre}</div>
            {s.items.map((t) => (
              <details className="card aide-item" key={t.q}>
                <summary>{t.q}</summary>
                <div className="aide-body">
                  {t.r}
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
        ))}
      </div>
    </>
  );
}
