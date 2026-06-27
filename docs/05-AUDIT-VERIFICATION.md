# 05 — Audit de vérification (avant mise en service)

> **Date :** 2026-06-27 · **Type :** vérification approfondie, pas de nouvelles fonctionnalités.
> **Question posée :** « Est-ce que le logiciel est vraiment prêt à être utilisé tous les jours, sans
> bug, sans perte de données, sans nombre faux, sans blocage qui frustre la propriétaire ? »

Cet audit relit le code réel (pas seulement les écrans) en se mettant à la place de la propriétaire —
femme non technique, à Lomé, qui s'en servira chaque jour, parfois depuis son téléphone, en français,
en FCFA — et cherche **tout ce qui peut produire un nombre faux qu'elle croira, perdre ses données, la
bloquer, ou ramener les frustrations de l'ancienne appli**, avant **décembre 2026** (départ de
l'employée de confiance, arrivée d'une recrue non encore fiable).

**Garde-fou de l'audit :** chaque correctif doit servir ce dont elle a réellement besoin. Rien qui
ajoute de la friction, la bloque, ou utilise un vocabulaire qu'elle n'emploie pas. Un « correctif » qui
lui complique la vie n'en est pas un.

## Méthode & couverture

Vérifié en lisant le code source (et non des résumés). Couches examinées directement :
- Tous les repositories : `lib/repo/{ventes,comptes,achats,depenses,benefices,controle,produits,stats}.ts`
- Couche données + schéma : `lib/db.ts` · Calcul argent : `lib/money.ts`
- Authentification + garde de routes : `lib/auth.ts`, `middleware.ts`
- Amorçage / données initiales : `scripts/seed.ts`
- Server actions (gestion d'erreurs) · UI ventes/soldes/stock/produits · CSS responsive

> ⚠️ **Le dépôt est modifié en parallèle par une autre session de travail** pendant cet audit (ex. :
> `ventes.ts` a reçu le journal d'activité en cours de route). Ce document est donc une **liste à
> rapprocher** de ce travail : vérifier l'état courant avant de corriger chaque point.

**Décisions arrêtées (cette session) :** Hébergement = **app web hébergée (cloud)**, accessible boutique
+ maison. Réconciliation = **calcul automatique de l'attendu**. Vente sans stock = **avertir, jamais
bloquer**. Dépenses récurrentes = **reportées automatiquement**.

**Échelle de gravité :** 🔴 P0 = corrompt l'argent ou perd les données · 🟠 P1 = nombre faux ou adoption
bloquée · 🟡 P2 = mauvaise expérience / petite justesse · ⚪ P3 = mineur / à surveiller.

---

## Ce qui est DÉJÀ correct (à ne pas « corriger »)

- Argent en entiers FCFA de bout en bout — aucun bug de virgule flottante (`money.ts`, `db.ts:6`).
- Format FCFA correct, signe négatif compris (`formatCFA`).
- Ventes/achats/contrôle transactionnels (`tx(...)`) — pas de corruption à moitié écrite.
- Édition/suppression d'une vente et d'un achat : le stock est correctement ré-ajusté et tracé dans
  `mouvement_stock` + `activite` (`ventes.ts:150-290`, `achats.ts:112-222`).
- Les ventes passées figent leur propre coût/prix (`ligne_vente.cout_unitaire`) — modifier un produit
  plus tard ne réécrit pas l'historique.
- Le journal d'activité « qui a fait quoi » est enregistré **et** dispose d'un écran
  (`app/(app)/activite/page.tsx`).
- Auth : en production `AUTH_SECRET` est obligatoire (sinon erreur), cookie httpOnly (`lib/auth.ts`).
- La garde de routes (`middleware.ts`) protège bien toutes les pages sauf `/connexion` et le statique.

---

## 🔴 P0 — Corrompt ses chiffres d'argent ou perd ses données

### P0-1. « Revient chaque mois » ne fait rien → marge réelle surévaluée chaque mois
Le drapeau `recurrente` est stocké et affiché comme badge, mais **aucun code ne le lit** pour reporter
la dépense au mois suivant (toutes les utilisations sont stockage/affichage : `depenses.ts`,
`DepenseRow.tsx`, `DepenseForm.tsx`). `totalDepensesMois` ne somme que les lignes dont la `date` tombe
dans le mois (`depenses.ts:117-126`). Elle coche « revient chaque mois » pour **loyer, salaires,
électricité** — ses plus gros postes — et le mois suivant ils **disparaissent silencieusement** du
calcul. La « marge réelle » affiche donc bien plus que la réalité. → tue son besoin n°3 (vraie marge).
**Correctif :** rendre le récurrent réel — inclure les dépenses récurrentes actives dans chaque mois
jusqu'à ce qu'elle les arrête (plus simple), ou les matérialiser le 1er de chaque mois.

### P0-2. Aucune sauvegarde / export, sur un hébergement où le fichier peut être effacé
Les données sont **un seul fichier** (`data/maboutique.db`, `db.ts:22-23`) ; ni export, ni sauvegarde,
ni récupération. Le cloud aggrave le risque : sur un hébergement à disque éphémère
(serverless/conteneur sans volume), **chaque redéploiement efface la base**. Pour quelqu'un dont tout le
but est de ne pas perdre la trace de son argent, c'est le pire scénario.
**Correctif :** (a) héberger sur un disque **persistant** (ou migrer ce fichier vers SQLite hébergé /
Postgres — `db.ts` est déjà abstrait pour ça) ; (b) **sauvegarde quotidienne hors-site** (~30 jours) ;
(c) bouton **« Exporter mes données »** (CSV par table) — un double qu'elle maîtrise, comme son grand
cahier.

### P0-3. « Est-ce que ça tombe juste ? » lui fait taper les deux nombres ; aucun recoupement
L'écran Soldes pré-remplit l'attendu avec la dernière valeur **tapée**, reportée (`comptes.ts:60-67`) ;
elle tape aussi le compté (`ReconciliationForm.tsx:16-23`). L'attendu en espèces n'est **jamais calculé à
partir des ventes en espèces déjà enregistrées**. La fonction-phare anti-vol stocke donc deux nombres
saisis à la main et les soustrait. La donnée existe pourtant (`vente.paiement`).
**Correctif :** calculer l'attendu par compte depuis la dernière réconciliation (espèces attendues =
dernier compté + ventes espèces − dépenses/retraits espèces ; idem TMoney/Flooz), pré-remplir, montrer
le détail, et **la laisser corriger**. Alors « Il manque X » voudra enfin dire ce qu'elle croit.

### P0-4. Une vente ne vérifie jamais le stock ; il passe en négatif en silence, invisible à la caisse
`ventes.ts:106-107` fait `stockApres = stockAvant - quantite` sans garde ; le sélecteur de caisse montre
nom + prix mais **pas le stock** (`VenteCaisse.tsx:94-104`). Vendre 5 d'un produit à 2 en stock donne
`-3`, en silence — ce qui fausse ensuite le Contrôle de stock (son besoin n°2) car le « théorique »
devient faux.
**Correctif (avertir, jamais bloquer) :** afficher le stock restant dans le sélecteur et le panier ;
quand la quantité dépasse le stock, montrer un avertissement clair (« Stock : il reste 2 — vendre quand
même ? ») mais **autoriser** la vente ; signaler le stock négatif en évidence dans l'écran Stock.

---

## 🟠 P1 — Nombre faux ou adoption bloquée

### P1-5. Chaque achat écrase le coût ET le prix de vente du produit, rétroactivement
Chaque achat fixe `produit.{prix_achat, frais, prix_vente}` au dernier lot (`achats.ts:72-82`). Deux
conséquences : (a) le coût est « dernier prix », pas moyen pondéré — un réapprovisionnement à un nouveau
prix re-valorise tout le stock existant, faussant les marges de l'ancien stock ; (b) il **change
automatiquement le prix de vente** d'articles déjà en rayon, alors qu'elle écrit le prix sur le produit
(80–95 % des articles). L'appli encaissera le nouveau prix pendant que l'étiquette indique l'ancien → la
caisse ne tombe plus juste. De plus `updateAchat` (modifier) ne re-propage pas les prix et ne recalcule
pas les frais unitaires (`achats.ts:112-179`) — création et modification divergent.
**Correctif :** distinguer « prix de vente du produit » (volontaire, stable) de « ce que ce lot a
coûté ». Ne pas écraser `prix_vente` en silence au réappro — confirmer (« Nouveau prix de vente ?
L'ancien était X »). Envisager le coût moyen pondéré. Au minimum, aligner création/modification.

### P1-6. Le revenu Mobile Money (commissions) n'est pas modélisé — la moitié de l'activité manque
Aucune gestion de `commission` nulle part (confirmé). TMoney/Flooz n'apparaissent que comme **moyen de
paiement** d'une vente produit et comme comptes de réconciliation. Or elle **ajoute ses commissions
crédit/dépôt à sa marge mensuelle**. Sa marge réelle ignore donc une source de revenu majeure.
**Correctif :** un moyen léger d'enregistrer le revenu de commissions (par jour ou par type) qui alimente
la marge réelle. Simple — une entrée « Commissions du jour/mois » par canal, pas un journal de
transactions.

### P1-7. « Aujourd'hui / ce mois » calculé de deux façons selon les modules
Ventes, Bénéfices, Dépenses, Stats calculent les bornes en heure **locale serveur** (`ventes.ts:30-34`,
`benefices.ts:18-22`, `depenses.ts:16-21`, `stats.ts:5-17`), tandis que Soldes utilise **UTC** littéral
(`comptes.ts:30-33`, `soldes/page.tsx:21`). Sur une machine GMT ça coïncide ; sur un serveur cloud d'une
autre région, une vente tombe le mauvais jour et « aujourd'hui » diffère d'un écran à l'autre.
**Correctif :** un seul utilitaire de bornes jour/mois, fixé à **Africa/Lomé (UTC+0)**, utilisé partout.

### P1-8. La saisie initiale en masse — son plus gros stress déclaré — n'existe pas
Elle dit que la **seule** chose stressante est d'entrer les 100+ produits ; « le reste n'est plus
stressant ». Aujourd'hui c'est un formulaire de 8 champs un par un (`produits/page.tsx:33-102`, `achats`).
Saisir 100+ produits un à un est le mur qui risque de la faire abandonner avant décembre.
**Correctif :** « Importer mes produits » — coller/CSV avec ses colonnes (nom, prix d'achat, transport,
prix de vente, quantité), aperçu, création en une fois. Réutiliser `createProduit` et
`coutDeRevientUnitaire`.

### P1-9. Inutilisable sur téléphone — alors qu'elle veut consulter depuis la maison/le téléphone
Tous les écrans à deux panneaux utilisent des colonnes en pixels fixes (`VenteCaisse.tsx:70` `1fr 420px` ;
achats/dépenses `420px 1fr` ; soldes `1fr 340px` ; contrôle `1fr 360px`) et il n'y a **aucune règle
`@media` dans toute l'appli** (confirmé). Sur un téléphone ~360–400px, une colonne de 420px déborde déjà
l'écran → défilement horizontal et mise en page cassée. La caisse, la réconciliation, les dépenses — ce
qu'elle voudrait justement regarder à distance — sont les écrans qui cassent.
**Correctif :** faire passer les grilles à une seule colonne sous un seuil téléphone (quelques `@media`,
ou `minmax`/`1fr` au lieu de `420px`). Pas de refonte — son brief refuse l'UI sophistiquée ; il s'agit
juste que « ça tienne dans l'écran ».

### P1-10. L'amorçage de production n'existe que comme un seed *destructif*, avec un mot de passe public
Un déploiement neuf crée des tables vides mais **n'amorce ni propriétaire ni comptes** ; or les comptes
de réconciliation (Espèces/TMoney/Flooz/Crédit) dont dépend tout l'écran Soldes ne sont créés **que** dans
`scripts/seed.ts:30-37`, sans UI pour les ajouter. Le seul amorçage possible est donc `npm run db:seed`,
qui **commence par `clear()` → `DELETE FROM` sur toutes les tables, y compris les vraies ventes, stock et
dépenses** (`seed.ts:6-15`). Le lancer une fois sur la base réelle « pour créer les comptes » efface la
boutique. Il embarque aussi un identifiant en dur **`maman` / `maman2026`** (dans git) — sur une appli
cloud accessible par internet, c'est un mot de passe public.
**Correctif :** une initialisation premier-démarrage **non destructive** (créer comptes + propriétaire
s'ils manquent, jamais supprimer), séparée du seed de démo ; forcer un changement de mot de passe (ou
fixer le mot de passe initial via variable d'environnement) ; réserver le seed destructif au dev, avec
garde-fou.

---

## 🟡 P2 — Expérience & petites justesses

- **P2-11. Suppressions sans confirmation ni annulation** (lignes vente/achat/produit/dépense appellent
  l'action immédiatement, ex. `produits/actions.ts:44-49`). Ajouter une confirmation nommant le montant.
- **P2-12. Échecs de formulaire silencieux** — les actions `return` sans rien dire sur entrée vide/
  invalide (`produits/actions.ts:13`), sans message ni confirmation de succès ; une utilisatrice non
  technique ne sait pas si ça a marché. Ajouter validation en ligne + confirmation brève.
- **P2-13. Produits quasi-doublons qui scindent le stock.** Recherche `trim`/insensible à la casse
  (`getProduitParNom`) mais l'espace interne n'est pas normalisé et l'achat auto-crée sur toute non-
  correspondance exacte — « Eau de source » vs « Eau de  source » deviennent deux produits, fragmentant
  stock et écart de contrôle. Normaliser les espaces ; avertir en cas de quasi-doublon.
- **P2-14. Nombres négatifs / parasites acceptés.** `parseCFA` garde le `-` (`money.ts:15`), renvoie 0
  sur du parasite ; `createProduit` n'interdit pas un prix négatif. Borner prix/quantités ≥ 0 avec
  message visible ; refuser une saisie clairement décimale plutôt que de la ×10 en silence. Rester
  minimal — le FCFA n'a pas de centimes.
- **P2-15. Une vente à crédit n'est pas suivie comme une créance.** Une vente « crédit (plus tard) »
  compte le revenu et la marge tout de suite et baisse le stock, mais rien n'enregistre qui doit quoi ni
  ne solde au paiement (`ventes.ts` et le compte crédit sont déconnectés). Rare pour elle, mais le solde
  crédit reste un nombre tapé à la main. À noter ; petit registre plus tard si elle le souhaite.
- **P2-16. Les rapports groupent par nom figé, pas par id produit.** `benefices.parProduit` et `stats`
  groupent sur le texte `nom_produit` (`benefices.ts:38`) ; renommer un produit en cours de mois le scinde
  en deux lignes. Grouper par `produit_id`, afficher le nom.
- **P2-17. Une erreur du repo devient une page de plantage.** Les server actions n'encadrent que
  `JSON.parse`, pas l'appel repo (ex. `createVente` à `ventes/actions.ts:38` non encadré) ; `produits`/
  `achats`/`depenses` n'ont aucun try/catch. Les repos lèvent (« Produit introuvable », « Aucun
  produit… ») sur des cas réels — ex. vendre un produit qu'un autre onglet vient de supprimer. Capturer
  et afficher un message français calme.

---

## ⚪ P3 — Mineur / à surveiller (probablement laisser)

- **P3-18.** L'arrondi des frais unitaires peut dériver de 1–2 F sur un lot (`coutDeRevientUnitaire`).
  Négligeable.
- **P3-19.** Édition concurrente à deux onglets = dernière écriture gagne ; possible une fois
  propriétaire + employée sur l'appli.
- **P3-20.** Pas de mode hors-ligne / PWA ; acceptable puisqu'elle est en ligne, seule une coupure réseau
  en pleine vente expose.

---

## Lacune transversale (pas un bug de code)

**La Phase 5 (connexion employée « vente seulement ») n'est pas faite, et elle est structurante pour sa
vraie peur.** Avec un seul compte propriétaire partagé, le journal d'activité ne peut pas vraiment
attribuer les actions à la nouvelle recrue vs à la propriétaire — ce qui sape tout le volet anti-vol au
moment où il compte le plus (décembre). Déjà au plan de route ; à inclure dans la même poussée
pré-décembre.

---

## Ordre de correction conseillé

1. **Arrêter la corruption/perte active d'abord :** P0-1 (dépenses récurrentes), P0-2 (hébergement
   persistant + sauvegarde + export), P0-4 (visibilité/avertissement stock). Plus fort impact, effort
   modéré.
2. **P0-3 réconciliation auto** + **P1-7 fuseau horaire** ensemble (même code de dates/agrégats).
3. **P1-5 prix/coût** et **P1-6 revenu Mobile Money** — sources restantes de « nombre faux ».
4. **P1-8 import en masse** — débloque l'adoption ; isolé, en parallèle. Puis **P1-9 responsive** et
   **P1-10 amorçage non destructif**.
5. **Passe de durcissement P2** (confirmations, retours de formulaire, doublons, bornes de saisie,
   crédit, groupement des rapports, gestion d'erreurs).
6. Revenir sur P3 + rôle employée (Phase 5) pour décembre.

> Avant chaque point : revérifier l'état courant — l'autre session active a pu déjà commencer.

---

## Plan de vérification (prouver chaque correctif)

- **Tests automatisés (vitest, `npm test` — suite existante).** Ajouter les cas manquants :
  - Une dépense récurrente saisie une fois apparaît dans le total / la marge réelle du mois suivant.
  - Vente quantité > stock → autorisée, stock négatif, avertissement vérifié.
  - La réconciliation calcule l'attendu en espèces depuis les ventes/dépenses ; la correction marche.
  - Un réappro à nouveau prix ne change pas l'étiquette en silence ; le coût se comporte comme choisi.
  - Le revenu de commissions Mobile Money alimente la marge réelle.
  - Fuseau : une vente proche de minuit (Lomé) tombe le bon jour dans Ventes **et** Soldes.
  - Import en masse : coller N lignes → N produits, coûts/marges via `coutDeRevientUnitaire`.
  - Confirmation de suppression, normalisation des doublons, borne des saisies négatives.
- **Passe manuelle bout-en-bout (`npm run dev`)** en suivant sa vraie journée en français : achat →
  vente (dont une sans stock) → contrôle → dépense → soldes → bénéfices ; vérifier que chaque mot est un
  mot qu'elle emploie et qu'aucun écran ne dit « non ».
- **Exercice sauvegarde/restauration :** exporter, supprimer la base de dev, restaurer, vérifier le
  retour des données. Redéployer sur l'hébergement choisi et confirmer la survie des données.
- **Exercice fuseau :** lancer avec `TZ` non-UTC ; confirmer que les bornes restent des jours de Lomé.

---

## Décisions ouvertes — tranchées, rien de bloquant

Hébergement (cloud, volume persistant), réconciliation (calcul auto), vente sans stock (avertir sans
bloquer), dépenses récurrentes (report) sont tranchés ci-dessus. Prêt à exécuter, en coordination avec
l'autre session active.
