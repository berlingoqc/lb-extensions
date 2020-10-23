# Casbin component

Composant qui fournit les éléments suivants:

- Repository pour stocker les CasbinPolicy
- Controller qui expose les CasbinPolicy
- Service pour exposer informations sur les rôles
- Authorizer pour @loopback/authorization qui valide avec casbin enforcer filter.
- Ajout d'un adapter casbin basé sur DefaultCrudRepository de @loopback/repository
- Différentes factory pour les enforcer loopback.
  - FileFactory : depuis des fichiers CSV
  - RepositoryFactory : depuis un repository avec des filters
- Utilitaire pour injecter le subject depuis la request
- Utilitaire pour injecter des attributs ABAC dans l'object de la request casbin

### Utilisation

Deux façon de l'utiliser.

1. En important directement le component
2. Avec AlbAuthMixin configuration [ici](../../../README.md)

#### Configuration

Les bindings suivants sont nécessaire:

```ts
// Path vers le model casbin utilisé
this.bind(CasbinBindings.MODEL_PATH).to(
  join(__dirname, '../casbin/rbac_model.conf'),
);
```

Optionnel:

```ts
// Si vous utilisez le FileEnforcerProvider
this.bind(CasbinBindings.POLICIES_PATH).to({
  admin: join(__dirname, '../casbin/rbac_policy.admin.csv'),
});
```

#### Ajout d'entrée

#### Authorization

Utilisation d'un enforcer:

```ts
// Nécessaire d'être authentifié(e) pour utiliser la directive @authorize
@authenticate('jwt')
@authorize({
  // Nécessaire, correspond à l'object. Devrait être similaire dans le même controlleur
  resource: 'object',
  // Nécessaire, correspond à l'action
  scopes: ['action'],
  // Optionel, optimise la recherche en cherchant seulement dans
  // les policies qui correspondent au role nécessaire.
  // Pour une action avec des rôles dynamiques, ne pas utiliser
  // pour chercher dans toutes les entrées
  allowedRoles: ['role1', 'role2'],
  // Aussi des voters peuvent être ajoutés pour injecter des data
  // ou pour voter sur l'authorization
  voters: []
})
```

Les voters fournis et leurs utilisation sont présent [helpers.ts](helpers.ts)

```ts
// Exemple d'utilisation
@authenticate('jwt')
@authorize({
  resource: 'profile',
  scopes: ['findById'],
  allowedRoles: ['admin'],
  voters: [
    // Inject l'id dans l'object ex : profile -> profile{id},
    // denied access si id n'est pas valide
    voterInjectRessourceId(0),
    // Inject l'id de l'owner de l'object qu'on veut accéder pour
    // permettre l'usage
    // denied access si l'entrée n'existe pas
    voterInjectObject(0, 'ProfileRepository', 'id', keepOriginal=false, filter={}),
  ],
})
async findById(
  @param.path.string('id') id: string,
  @param.filter(Profile, {exclude: 'where'})
  filter?: FilterExcludingWhere<Profile>,
): Promise<Profile> {
  return this.profileRepository.findById(id, filter);
}
```
