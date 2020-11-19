/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  Model,
  DefaultCrudRepository,
  Filter,
} from '@loopback/repository';

/**
 * Utilitaire pour générer des controllers pour exposer les
 * relations d'une Entity avec les opérations suivantes
 * /{model}/{id}/{relation}/{fk}
 *
 * GET
 * POST
 * GET (by id)
 * PUT
 * DELETE
 */

import {Constructor, inject, MixinTarget} from '@loopback/core';
import {
  CrudControllerMixinOptions,
  CrudMixinOptions,
  InjectableRepository,
  ModelDef,
} from './crud.controller';
import {get, post, put, del, param, RestApplication} from '@loopback/rest';
import {parampathFunction} from './utility';

// Définition de la relation d'un model a exposer
export interface ModelRelation {
  // Définition du Model
  modelRelationDef: ModelDef;
  // Options pour le controller
  optionsRelation: CrudMixinOptions;
}

// Permet d'ajouter directement un CrudRelationController anonyme
// dans votre application
export const addCrudRelationController = <
  E extends Entity,
  ID,
  ER extends Entity,
  IDR
>(
  app: RestApplication,
  modelDef: ModelDef,
  modelRelationRef: ModelDef,
  repo: InjectableRepository<E, ID>,
  options: CrudControllerMixinOptions,
  optionsRelation: CrudMixinOptions,
) => {
  const name =
    typeof repo === 'string'
      ? repo
      : repo instanceof DefaultCrudRepository
      ? 'null'
      : repo.name;

  class Anonymous extends CrudRelationControllerMixin<
    Constructor<object>,
    E,
    ID,
    ER,
    IDR
  >(Object, modelDef, modelRelationRef, options, optionsRelation) {
    constructor(
      @inject(`repositories.${name}`, {optional: true})
      crudRepository: DefaultCrudRepository<any, any, {}>,
    ) {
      super();
      if (!crudRepository) {
        if (repo instanceof DefaultCrudRepository) {
          crudRepository = repo as DefaultCrudRepository<any, any, {}>;
        } else {
          throw new Error('Cound not inject a repository');
        }
      }
      this.repository = crudRepository;
    }
  }

  const bindings = app.controller(
    Anonymous,
    `${options.name}->${optionsRelation.name} CRUD`,
  );
  return bindings.key;
};

// Mixin pour l'ajout des handlers pour les requêtes d'une relation
// d'un modèle avec les accessor de relations dans le repository
// du model parent.
// Pour l'utiliser sur votre relation vous devez déclarer vos accessor
// dans votre repository. Peux être fait avec la commande `lb4 relation`
/**
 *
 * @param superClass
 * @param repoEntity
 * @param repoEntityRelation
 * @param options
 * @param optionsRelation
 */
export function CrudRelationControllerMixin<
  T extends MixinTarget<object>,
  ES extends Entity,
  IDS,
  ER extends Entity,
  IDR
>(
  superClass: T,
  repoEntity: Function & {prototype: any} & typeof Model,
  repoEntityRelation: Function & {prototype: any} & typeof Model,
  options: CrudControllerMixinOptions,
  optionsRelation: CrudMixinOptions,
) {
  const basePath = `${options.basePath ?? ''}/${options.name}/{id}/${
    optionsRelation.name
  }`;

  if (!options.id) options.id = 'id';
  if (!options.idType) options.idType = 'number';

  const parampath = parampathFunction(options);

  class CrudRelationController extends superClass {
    repository: DefaultCrudRepository<any, any, {}> & any;

    @get(`${basePath}`)
    async getRelationModel(
      @parampath() id: any,
      @param.query.object('filter') filter?: Filter<ER>,
    ) {
      return this.getRelationThings(id).find(filter);
    }

    @post(`${basePath}`)
    async createRelationModel() {}

    @get(`${basePath}/{fk}`)
    async getRelationModelById() {}

    @put(`${basePath}/{fk}`)
    async putRelationModelById() {}

    @del(`${basePath}/{fk}`)
    async delRelationModel() {}

    getRelationThings(id: any) {
      return this.repository[optionsRelation.name](id);
    }
  }

  return CrudRelationController;
}
