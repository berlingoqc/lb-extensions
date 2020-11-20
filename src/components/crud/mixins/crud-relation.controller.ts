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
  disable,
  InjectableRepository,
  ModelDef,
} from './crud.controller';
import {
  get,
  post,
  put,
  del,
  param,
  RestApplication,
  HttpErrors,
  requestBody,
  getModelSchemaRef,
} from '@loopback/rest';
import {parampathFunction} from './utility';
import {chain, DecoratorInfo, getDecoratorsProperties} from '../../../helpers';

export type AccessorType = 'BelongTo' | 'HasMany' | 'HasOne';

export function identityAccessorType(item: any): AccessorType {
  const str = item.toString();
  if (str) {
    if (str.includes('HasMany')) {
      return 'HasMany';
    } else if (str.includes('HasOne')) {
      return 'HasOne';
    } else if (str.includes('BelongsTo')) {
      return 'BelongTo';
    }
  }
  throw new HttpErrors.BadRequest(
    'Relation is not an HasMany, HasOne or BelongTo',
  );
}

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

      this.validateTypeOfAccessor();
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

  const disableDecInfo: DecoratorInfo = {func: disable, args: []};

  const parampath = parampathFunction(options.idType, 'id');
  const parampathrelation = parampathFunction(options.idType, 'fk');

  let decoratorsProperty: {[id: string]: DecoratorInfo[]} = {};

  let accessorString: AccessorType;

  let findData: (id: any, filter: any) => any;

  class CrudRelationController extends superClass {
    repository: DefaultCrudRepository<any, any, {}> & any;

    validateTypeOfAccessor() {
      const relationAccessor = this.repository[optionsRelation.name];
      if (!relationAccessor) {
        throw new HttpErrors.BadRequest(
          `Relation ${optionsRelation.name} dont exist on ${options.name}Repository`,
        );
      }
      // Détermine le type de relation pour désactiver les API et avoir les
      // bons callback
      accessorString = identityAccessorType(relationAccessor);
      switch (accessorString) {
        case 'BelongTo':
          findData = (id: any) => this.getRelationThings(id);
          decoratorsProperty = {
            create: [disableDecInfo],
            get: [disableDecInfo],
            update: [disableDecInfo],
            delete: [disableDecInfo],
          };
          break;
        case 'HasOne':
          findData = (id: any) => this.getRelationThings(id).get();
          decoratorsProperty = {
            get: [disableDecInfo],
          };
          break;
        case 'HasMany':
          findData = (id: any, filter: any) =>
            this.getRelationThings(id).find(filter);
          break;
      }
    }

    @get(`${basePath}`)
    @chain(...getDecoratorsProperties(options.properties))
    async findRelationModel(
      @parampath() id: any,
      @param.query.object('filter') filter?: Filter<ER>,
    ) {
      return findData(id, filter);
    }

    @get(`${basePath}/{fk}`)
    @chain(...(decoratorsProperty['get'] ?? []))
    @chain(...getDecoratorsProperties(options.properties))
    async getRelationModel(
      @parampath() id: any,
      @parampathrelation() fk: any,
      @param.query.object('filter') filter: Filter<ER> = {},
    ) {
      const filterCertified = Object.assign(filter, {
        where: {[optionsRelation.name]: fk},
      });
      const items = await this.getRelationThings(id).find(filterCertified);
      if (items.length !== 1) {
        throw new HttpErrors.NotFound('Not found boyy');
      }
      return items[0];
    }

    @post(`${basePath}`)
    @chain(...(decoratorsProperty['create'] ?? []))
    @chain(...getDecoratorsProperties(options.properties))
    async createRelationModel(
      @parampath() id: any,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(repoEntityRelation, {
              title: '',
              exclude: [], // maybe my id if ssoooo
              optional: [], // relation id
            }),
          },
        },
      })
      body: Partial<ER>,
    ) {
      return this.getRelationThings(id).create(body);
    }

    @put(`${basePath}/{fk}`)
    @chain(...(decoratorsProperty['update'] ?? []))
    @chain(...getDecoratorsProperties(options.properties))
    async putRelationModelById(
      @parampath() id: any,
      @parampathrelation() fk: any,
      @requestBody()
      body: Partial<ER>,
    ) {
      return this.getRelationThings(id).patch(body, {
        [optionsRelation.id as string | number]: fk,
      });
    }

    @del(`${basePath}/{fk}`)
    @chain(...(decoratorsProperty['delete'] ?? []))
    @chain(...getDecoratorsProperties(options.properties))
    async delRelationModel(@parampath() id: any, @parampathrelation() fk: any) {
      return this.getRelationThings(id).delete({
        [optionsRelation.id as string | number]: fk,
      });
    }

    getRelationThings(id: any) {
      return this.repository[optionsRelation.name](id);
    }
  }

  return CrudRelationController;
}
