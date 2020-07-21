# @alborea/loopback-sso-extensions

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)


Ce repository contient une librairie pour venir offrir une suite de fonctionnalité
supplémentaire dans une application loopback.

### Authentification et Authorization

Avec le mixin `AlbAuthMixin` qui ajoute et configure les éléments suivants

* Ajoute composante pour Authentification et Authorization
* Ajout service de validation des rôles
* Ajout d'une stratégie pour la récupération des JWT
  * JWTAutenticationStrategy qui valide le Token localement depuis la requête HTTP
  * JWTRemoteStrategy qui valide le token avec un serveur SSO remote
* Configuration de l'application REST avec OpenAPI 3 avec l'information du package.json et la securitySchemes de configurer
* Configure la séquence d'authentification qui peut être étendu avec `AlbLoopbackAuthBindings.SEQUENCE_PROVIDER`
* Configure le RestExplorer
* Configure les controllers

Utilisateur de `AlbAuthMixin`:

```ts
// index.ts
export async function main(options: AlbAuthConfig = {}) {
  // Étape nécessaire
  options.dirname = __dirname; // configurer le dirname
  options.pkg = require('../package.json'); // configurer le package info
  options.strategy = 'remote'; // choix de la strategie pour JWT

  // Code par default générer par loopback
  const app = new XmationApplication(options);
  app.basePath('/api');

  await app.boot();
  await app.migrateSchema();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

// application.ts
export class XmationApplication extends BootMixin(ServiceMixin(RepositoryMixin(AlbAuthMixin(RestApplication)))) {
  constructor(options: AlbAuthConfig = {}) {
    super(options);

    // optionel ajout un action provider dans la sequence qui sera executer
    // dans la sequence de validation
    this.bind(AlbLoopbackAuthBindings.SEQUENCE_PROVIDER).toProvider(
      MyCustomActionProvider,
    );
  }
}
```
