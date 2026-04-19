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

## Signaler une vulnérabilité

Si vous pensez avoir trouvé une vulnérabilité de sécurité dans le projet, veuillez nous la signaler comme décrit ci-dessous. Nous prenons toutes les vulnérabilités de sécurité au sérieux. Si vous avez trouvé une vulnérabilité dans une bibliothèque tierce, veuillez la signaler aux mainteneurs de cette bibliothèque.

## Processus de signalement

Veuillez ne pas signaler les vulnérabilités de sécurité via des issues GitHub publiques. Veuillez utiliser le canal de sécurité officiel sur GitHub en créant un [avis de sécurité](https://github.com/axios/axios/security).

## Politique de divulgation

Lorsque nous recevons un rapport de vulnérabilité de sécurité, nous lui assignons un responsable principal. Cette personne est responsable du rapport de vulnérabilité. Le responsable confirmera le problème et déterminera les versions affectées. Il évaluera ensuite le problème et déterminera la gravité du problème. Le responsable développera un correctif pour le problème et préparera une version. Le responsable informera le rapporteur lorsque le correctif sera prêt à être annoncé.

## Mises à jour de sécurité

Les mises à jour de sécurité seront publiées dès que possible après que le correctif a été développé et testé. Nous informerons les utilisateurs de la version via le dépôt GitHub du projet. Nous publierons également les notes de version et les avis de sécurité sur la page des versions GitHub du projet. Nous déprécierons également toutes les versions contenant la vulnérabilité de sécurité.

## Partenaires de sécurité et remerciements

Nous tenons à remercier les chercheurs en sécurité suivants pour leur collaboration afin de contribuer à la sécurité du projet pour tous :

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
