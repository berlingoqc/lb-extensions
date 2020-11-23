/* eslint-disable @typescript-eslint/no-explicit-any */
import {RestApplication} from '@loopback/rest';
import {addCrudRelationController} from './crud-relation.controller';
import {addCRUDController} from './crud.controller';
import {
  CrudControllerMixinOptions,
  CrudModelWithRelations,
  InjectableRepository,
  ModelDef,
  ModelRelation,
} from './model';

export function addCRUDModelsControllerWithRelations(
  app: RestApplication,
  models: CrudModelWithRelations[],
) {
  for (const model of models) {
    addCRUDControllerWithRelations(
      app,
      model.model,
      model.repo,
      model.options,
      model.relations,
    );
  }
}

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
