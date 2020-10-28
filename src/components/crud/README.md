# Utilitaire CRUD

Cette section contient les éléments pour générer plus facilement des
controllers et repository qui implémente les fonctionnalités CRUD.

Le but est de réduire le boilerplate code qui doit etre ajouté dans
les controllers pour exposer le repository. Et dans le plus part des cas
nous n'avons pas à les modifiés seulement à ajoutés des décorateurs.

## Crud Controller Mixin

Définitions de [CrudControllerMixinOptions](mixins/crud.controller.ts)

### Crée un controlleur CRUD Custom

Permet d'ajouter d'autre fonction additionel

```ts
// Création d'un CRUDController custom
export class MyModelController extends CrudControllerMixin<
  Constructor<Object>,
  MyModel,
  typeof MyModel.prototype.id
>(Object, MyModel, {name: 'mymodel', properties: []}) {
  constructor(
    @repository(MyModelRepository)
    myModelRepository: MyModelRepository,
  ) {
    // Doit fournir le repository pour le mixin
    this.repository = myModelRepository;
  }
}
```

### Crée un controlleur CRUD anonyme

Dans votre `application.ts` durant l'initialization

```ts
// Crée un CrudController custom et l'ajoute dans votre application
addCRUDController(this, MyModel, MyModelRepository, {
  name: 'mymodel',
  properties: [],
});
```
