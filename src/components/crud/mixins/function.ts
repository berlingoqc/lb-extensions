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
