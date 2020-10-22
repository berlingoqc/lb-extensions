# Auditz

Clone de [loopback-auditz](https://www.npmjs.com/package/loopback-auditz)
qui est utilisé dans l'ancienne version du portail pour fournir des
informations sur les opérations executés sur une table.

Fonctionnalité à reproduire les points suivant:

- Soft Deletes
- Timestamps update/create/delete
- Enregistre ID de l'user qui execute l'opération
- Logging des révisions dans une table séparé (manquant)

Ajout les points suivants:

- Mixin pour controlleur pour accéder au informations des tables supprimés

### Utilisation
