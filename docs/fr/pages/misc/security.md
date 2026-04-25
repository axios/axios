# Politique de sécurité

## ⚠️ Bombe de décompression / mise en tampon de réponse sans limite

Par défaut, `maxContentLength` et `maxBodyLength` valent `-1` (illimité). Un serveur malveillant ou compromis peut renvoyer un petit corps compressé en gzip/deflate/brotli qui s'étend à plusieurs gigaoctets, épuisant la mémoire du processus Node.js.

**Si vous effectuez des requêtes vers des serveurs que vous ne contrôlez pas totalement, vous DEVEZ définir `maxContentLength` en fonction de votre charge.** La limite est appliquée chunk par chunk pendant la décompression en flux, il suffit donc de la définir pour neutraliser les attaques de bombe de décompression.

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 Mo
  maxBodyLength: 10 * 1024 * 1024,
});

// Ou globalement :
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

La valeur par défaut n'a pas été durcie car cela casserait silencieusement tout téléchargement légitime dépassant le plafond choisi. Le choix d'un plafond sûr pour des sources non fiables incombe à l'application.

## Vérifier une version publiée

Chaque tarball `axios` publié sur npm provient de GitHub Actions et comporte une [attestation de provenance npm](https://docs.npmjs.com/generating-provenance-statements) qui lie cryptographiquement le paquet au workflow et au SHA de commit qui l'a produit.

Les consommateurs peuvent vérifier la provenance localement :

```bash
# Vérifier chaque paquet de votre lockfile, y compris axios
npm audit signatures
```

Une vérification réussie prouve que le tarball a été construit dans l'environnement GitHub Actions de `axios/axios` à partir d'un commit connu — il n'a pas été altéré entre la construction et le registre. Elle ne prouve **pas** que le code de ce commit est exempt de bugs.

Si `npm audit signatures` signale une attestation manquante ou invalide pour une version récente d'`axios`, traitez-le comme un incident potentiel de chaîne d'approvisionnement et signalez-le via le canal privé ci-dessous.

## Signaler une vulnérabilité

Si vous pensez avoir trouvé une vulnérabilité de sécurité dans le projet, veuillez nous la signaler comme décrit ci-dessous. Nous prenons toutes les vulnérabilités de sécurité au sérieux. Si vous avez trouvé une vulnérabilité dans une bibliothèque tierce, veuillez la signaler aux mainteneurs de cette bibliothèque.

## Processus de signalement

Veuillez ne pas signaler les vulnérabilités de sécurité via des issues GitHub publiques. Veuillez utiliser le canal de sécurité officiel sur GitHub en créant un [avis de sécurité](https://github.com/axios/axios/security/advisories/new).

## Politique de divulgation

Lorsque nous recevons un rapport de vulnérabilité, nous lui assignons un responsable principal. Le responsable confirme le problème, détermine les versions affectées, évalue la gravité, développe et publie un correctif, et coordonne la divulgation publique avec le rapporteur.

### Engagement de résolution et de divulgation sous 60 jours

Nous nous engageons à **résoudre et divulguer publiquement chaque avis de sécurité valide dans les 60 jours calendaires suivant le rapport initial**, à compter du moment où un rapport est reçu via le [canal des avis de sécurité GitHub](https://github.com/axios/axios/security/advisories/new).

L'horloge des 60 jours est un engagement envers les rapporteurs et les consommateurs en aval — un filet de sécurité, pas un objectif. Si nous ne pouvons pas livrer un correctif à temps, nous publions tout de même l'avis au jour 60 avec les meilleures recommandations d'atténuation disponibles, afin que les consommateurs puissent agir.

**Jalons dans la fenêtre de 60 jours :**

| Jour | Jalon                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Rapport reçu. Avis privé ouvert sur GitHub.                                                                                               |
| ≤ 3  | Accusé de réception envoyé au rapporteur. Décision de triage : dans le périmètre / hors du périmètre / doublon / informations manquantes. |
| ≤ 10 | Gravité évaluée (CVSS v4 le cas échéant). Versions affectées confirmées. CVE demandé via GitHub si un identifiant public est justifié.    |
| ≤ 45 | Correctif développé, revu, testé. Release candidate préparée sur une branche privée. Aperçu proposé au rapporteur pour validation.        |
| ≤ 60 | Version corrigée publiée sur npm. Avis public + CVE publiés. Rapporteur crédité sauf demande contraire. CHANGELOG mis à jour.             |

**Exceptions et prolongations.**

- Si un rapporteur demande un embargo plus court (par exemple pour présenter ses résultats à une conférence), nous nous adaptons dans la mesure du possible.
- Si un correctif nécessite un changement cassant, la coordination avec des consommateurs en aval majeurs, ou une publication en amont de `follow-redirects` / `form-data` / `proxy-from-env`, nous pouvons prolonger au-delà de 60 jours. Toute prolongation est divulguée publiquement au jour 60 via l'avis, avec une ETA révisée et la raison.
- Si un rapport est **hors du périmètre** (par exemple, il relève d'un non-objectif explicite documenté dans le [modèle de menaces](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md) du projet), nous le clôturons avec une explication au rapporteur dans la fenêtre de triage (≤ 3 jours). Les rapports hors périmètre n'entrent pas dans la file des 60 jours.
- Les **vulnérabilités activement exploitées** sont traitées comme des incidents : le correctif et l'avis sont publiés dès qu'un patch est validé, hors du calendrier des 60 jours.

**Attentes vis-à-vis du rapporteur.**

Pendant qu'un rapport est sous embargo, nous demandons aux rapporteurs de s'abstenir de toute divulgation publique jusqu'à la plus proche de : (a) la publication coordonnée de l'avis, ou (b) le jour 60. Si l'échéance des 60 jours passe sans action de notre part, les rapporteurs sont libres de divulguer indépendamment — nous considérerons cela comme un échec de notre part, pas du leur.

## Mises à jour de sécurité

Les mises à jour de sécurité sont publiées dès que possible après que le correctif a été développé et testé. Nous informons les utilisateurs via le dépôt GitHub du projet et publions les notes de version et les avis de sécurité sur la page des versions GitHub. Nous déprécions également toutes les versions contenant la vulnérabilité.

## Réponse à incident côté mainteneur

Pour les scénarios de compromission affectant les comptes mainteneurs, les postes de travail ou l'infrastructure de publication (phishing, clé matérielle volée, tag ou publication inattendus), le projet maintient un runbook interne de réponse à incident dans [THREATMODEL.md §3.7](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md#37-incident-response-runbook). Il couvre la révocation des sessions, la rotation des clés, la notification en aval et les procédures de dépublication/dépréciation.

## Partenaires de sécurité et remerciements

Nous tenons à remercier les chercheurs en sécurité suivants pour leur collaboration afin de contribuer à la sécurité du projet pour tous :

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
