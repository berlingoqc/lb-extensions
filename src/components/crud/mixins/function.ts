import {RestApplication} from '@loopback/rest';
import {
  addCrudRelationController,
  ModelRelation,
} from './crud-relation.controller';
import {
  addCRUDController,
  CrudControllerMixinOptions,
  InjectableRepository,
  ModelDef,
} from './crud.controller';

/**
 *  Fonction pour faciliter l'exposition d'un models etde ses relations par CRUD/REST
 *
 * @param app : Application qui a le mixin RestApplication
 * @param modelDef : La définition de la class qui est exposer
 * @param repo : Information pour l'injection du repository a utilisé
 * @param options : Options pour la configuration du controller
 * @param relations : Liste des relations du modèles à exposer
 */
export function addCRUDControllerWithRelations(
  app: RestApplication,
  modelDef: ModelDef,
  repo: InjectableRepository<any, any>,
  options: CrudControllerMixinOptions,
  relations: ModelRelation[],
) {
  addCRUDController(app, modelDef, repo, options);
  for (const relation of relations) {
    addCrudRelationController(
      app,
      modelDef,
      relation.modelRelationDef,
      repo,
      options,
      relation.optionsRelation,
    );
  }
}
