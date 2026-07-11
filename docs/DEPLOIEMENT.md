# Déploiement — Ma Boutique

Cette app se déploie comme **un serveur unique + un disque qui garde la base**.
La base est un fichier SQLite (`node:sqlite`), donc l'hébergeur doit offrir un
**disque persistant** — ce qui exclut Vercel/Netlify (serverless, disque effacé),
mais **pas** l'accès par internet. Guide ci-dessous : **Fly.io** (recommandé).

Tout se fait depuis ton ordinateur (aux États-Unis) ; ta mère ouvre juste l'URL
sur son téléphone.

---

## 0. Une seule fois : installer l'outil Fly

```bash
# macOS
brew install flyctl
fly auth signup    # ou : fly auth login
```

## 1. Créer l'application (sans déployer encore)

Depuis la racine du projet :

```bash
fly launch --no-deploy
```

- Accepte de réutiliser le `fly.toml` existant.
- Choisis un nom d'app unique (ex. `ma-boutique-togo`) et reporte-le dans
  `fly.toml` (`app = "..."`) si Fly en propose un autre.
- Région : **cdg** (Paris) est déjà réglée — la meilleure vers le Togo.

## 2. Créer le disque qui garde la base

```bash
fly volumes create maboutique_data --region cdg --size 1
```

1 Go suffit très largement (la base fait quelques Mo). Le nom
`maboutique_data` doit correspondre à `fly.toml` → `[mounts] source`.

## 3. Régler les secrets (obligatoire)

L'app **refuse de démarrer en production sans `AUTH_SECRET`**, et ne crée le
compte propriétaire qu'à partir de ces variables :

```bash
# Secret de session : long et aléatoire. Génère-le puis colle-le.
fly secrets set AUTH_SECRET="$(openssl rand -base64 48)"

# Compte de ta mère, créé automatiquement au 1er démarrage sur une base vide :
fly secrets set OWNER_LOGIN="maman"
fly secrets set OWNER_INITIAL_PASSWORD="choisis-un-mot-de-passe-solide"
```

> `OWNER_INITIAL_PASSWORD` ne sert qu'**une fois** : à créer le compte sur une
> base vide. Ensuite, change-le depuis l'app si tu veux ; la variable peut rester.
> Aucun mot de passe n'est jamais codé en dur (le repli `maman2026` est
> uniquement pour le développement local).

## 4. Déployer

```bash
fly deploy
```

Fly construit l'image (Dockerfile), la lance, branche le volume et active
HTTPS. À la fin il affiche l'URL : `https://<ton-app>.fly.dev`.

## 5. Vérifier

```bash
fly open          # ouvre l'URL dans le navigateur
fly logs          # suivre les journaux (utile au 1er démarrage)
```

- La page de connexion doit apparaître.
- Connexion avec `OWNER_LOGIN` / `OWNER_INITIAL_PASSWORD`.
- La boutique démarre **vide** (aucun produit) : c'est normal. Ta mère importe
  ses produits (Produits → Importer) et fait son premier contrôle de stock.

---

## Mettre à jour l'app plus tard

```bash
git pull            # ou tes modifs
fly deploy          # reconstruit et redéploie ; la base sur le volume est intacte
```

## Domaine personnalisé (optionnel)

```bash
fly certs add boutique.tondomaine.com
# puis crée l'enregistrement DNS que Fly indique (CNAME → <ton-app>.fly.dev)
```

## Sauvegardes — deux filets

1. **Dans l'app** : bouton **Sauvegarde** → télécharge un fichier `.db` complet.
   Range-le (clé USB / Drive / e-mail). À faire chaque semaine.
2. **Copie depuis le serveur** (de temps en temps, depuis ton ordinateur) :
   ```bash
   fly ssh console -C "cat /data/maboutique.db" > sauvegarde-$(date +%F).db
   ```
   ou des snapshots automatiques du volume :
   ```bash
   fly volumes snapshots list maboutique_data
   ```

## Restaurer une base

Depuis un fichier `.db` de sauvegarde, vers le volume :

```bash
fly ssh sftp shell
# put ./sauvegarde-XXXX.db /data/maboutique.db
fly apps restart <ton-app>
```

---

## Récapitulatif « avant la mise en ligne »

- [ ] `AUTH_SECRET` réglé (aléatoire, long)
- [ ] `OWNER_LOGIN` + `OWNER_INITIAL_PASSWORD` réglés
- [ ] Volume `maboutique_data` créé (base persistante)
- [ ] `fly deploy` réussi, URL accessible, connexion OK
- [ ] Boutique démarre vide → importer les vrais produits
- [ ] Première sauvegarde testée (bouton Sauvegarde)

## Autre hébergeur ?

Le `Dockerfile` est universel. Pour **Railway/Render** : connecte le dépôt
GitHub, ajoute un volume monté sur `/data`, règle les mêmes variables
d'environnement (`AUTH_SECRET`, `OWNER_LOGIN`, `OWNER_INITIAL_PASSWORD`,
`MABOUTIQUE_DB=/data/maboutique.db`). Pour un **VPS** : `docker build` +
`docker run` avec `-v maboutique_data:/data` et un reverse-proxy Caddy pour
le HTTPS. Demande-moi la config exacte si tu changes de piste.
