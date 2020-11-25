# Utilitaire CRUD

Cette section contient les éléments pour générer plus facilement des
controllers et repository qui implémente les fonctionnalités CRUD.

Le but est de réduire le boilerplate code qui doit etre ajouté dans
les controllers pour exposer le repository. Et dans le plus part des cas
nous n'avons pas à les modifiés seulement à ajoutés des décorateurs.

## Exposition de modèles et relations en une étape

Vous pouvez dynamiquement ajouter un contrôleur pour un modèle avec les
relations de façon anonyme. Cette méthode est à favoriser et si vous
désirez ajouter d'autres fonctions, faites un autre contrôleur qui écoute sur
le même endpoint. C'est plus simple et demande moins de boilerplate et
de configuration.

Pour plus de détails sur la configuration, voir les commentaires [ici](mixins/crud.controller.ts)

```typescript
import { addCRUDModelsControllerWithRelations  } from '@alborea/loopback-sso-extensions';
....

const MODELS: CrudModelWithRelationss = [
  {
    model: MonModel,
    repo: MonModelRepository,
    options: {
      names: 'profiles',
    },
    relations: [
      {
        modelRelationDef: RelationDeMonModel,
        optionsRelations: {
          name: 'relations'
        }
      }
    ]
  }
];

export class MonApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)){

    models = [];

    constructor(options: ApplicationConfig = {}) {
      super(options);


      addCRUDModelsControllerWithRelations(
        this,
        MODELS,
      );
    }
  },
) {

```

## Liste des API générés

Voici une description rapide des fonctions qui sont ajoutées
par le mixin.

### CRUDModel

La racine de l'API est le nom spécifié

| Name        | OP     | PATH   |
| ----------- | ------ | ------ |
| create      | POST   | /      |
| count       | GET    | /count |
| find        | GET    | /      |
| updateAll   | PATCH  | /      |
| findById    | GET    | /{id}  |
| updateById  | PATCH  | /{id}  |
| replaceById | PUT    | /{id}  |
| deleteById  | DELETE | /{id}  |

### CRUDRelationModel

La racine de l'API est le nom spécifié pour le modèle parent et l'id de l'item.

ex: /parent/1/...


| Name       | OP   | PATH  | AccessorType               |
| ---------- | ---- | ----- | -------------------------- |
| find       | GET  | /     | HasMany, HasOne, BelongsTo |
| create     | POST | /     | HasMany, HasOne            |
| get        | GET  | /{id} | HasMany                    |
| updateById | GET  | /{id} | HasMany, HasOne            |
| deleteById | GET  | /{id} | HasMany, HasOne            |

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
