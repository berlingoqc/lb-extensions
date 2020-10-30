# Auditz

Clone de [loopback-auditz](https://www.npmjs.com/package/loopback-auditz)
qui est utilisé dans l'ancienne version du portail pour fournir des
informations sur les opérations executés sur une table.

Fonctionnalités reproduisant les points suivants:

- Soft Deletes
- Timestamps update/create/delete
- Enregistre ID de l'user qui execute l'opération
- Logging des révisions dans une table séparé

Ajoute les points suivants:

- Mixin pour contrôleur permettant d'accéder aux informations des tables supprimées

### Utilisation

- Application de AuditzModelMixin
- Application de AuditzRepositoryMixin
- Application de AuditzControllerMixin (optionel)
- Ajout des informations de modification dans la table de révision (optionel)

```ts
// Création de votre model avec AuditzModelMixin
@model()
export class CustomModel extends AuditzModelMixin(BaseEntity) {
  @property()
  id: number;
}

// Config pour activer la révisions, peux être supprimé ou mis à `null`
// si vous ne désirez pas de révision
const configRevision = {
  revision: true,
  table: 'CustomModel'
}


// Création de votre repository avec AuditzRepositoryMixin
export class CustomModelRepository extends AuditzRepositoryMixin<
  CustomModel,
  typeof CustomModel.prototype.id,
  Constructor<
    DefaultCrudRepository<CustomModel, typeof CustomModel.prototype.id, {}>
  >
>(DefaultCrudRepository, configRevision) {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
    @inject.getter(SecurityBindings.USER)
    userGetter: Getter<UserProfile>,
  ) {
    super(CasbinPolicy, dataSource);
    // Doit fournir @inject.getter(SecurityBindings.USER)
    // à la classe du mixin pour être capable de récuper
    // l'information de l'usager qui execute les requests
    this.userGetter = userGetter;
  }
}

// Optionnellement ajout le AuditzControllerMixin pour ajouter
// les endpoints supplémentaires
export class PoliciesController extends AuditzControllerMixin<
  CustomModel,
  typeof CustomModel.prototype.id,
  Constructor<object>
>(Object, {
  basePath: '/custom-model',
  ressource: 'customModel',
  roles: ['customrole'],
  modelClass: CustomModel,
}) {
  ....
}

```
