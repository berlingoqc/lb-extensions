/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  Model,
  DefaultCrudRepository,
  Filter,
} from '@loopback/repository';

import {Constructor, inject, MixinTarget} from '@loopback/core';
import {param, RestApplication, HttpErrors} from '@loopback/rest';
import {chain, getDecoratorsProperties} from '../../../helpers';
import {
  parampathFunction,
  requestBodyDecoratorGetter,
  operatorDecorator,
} from './decorator';
import {
  CrudControllerMixinOptions,
  CrudOperators,
  CrudRelationControllerMixinOptions,
  InjectableRepository,
  ModelDef,
} from './model';

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
  optionsRelation: CrudRelationControllerMixinOptions,
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

/**
 * Mixin pour l'ajout des handlers pour les requêtes d'une relation
 * d'un modèle avec les accessor de relations dans le repository
 * du model parent.
 * Pour l'utiliser sur votre relation vous devez déclarer vos accessor
 * dans votre repository. Peut être fait avec la commande `lb4 relation`
 *
 * Pour une relation BelongsTo les api suivants sont innaccessible:
 *  * create
 *  * getById
 *  * update
 *  * delete
 *
 * Pour une relation HaveOne les api suivants sont innaccessible:
 *  * getById
 *
 * @param superClass
 * @param repoEntity
 * @param repoEntityRelation
 * @param options
 * @param optionsRelation
 *
 * @template T Type de constructeur de l'object qu'on applique le mixin
 * @template ES Entité Source. Le type du model qui contient la relation
 * @template IDS ID Source. Le type de l'identifiant de l'Entité Source
 * @template ER Entité Relation. Le type du model de la relation qu'on expose
 * @template IDR ID Relation. Le type de l'identifiant de l'Identifiant de la relation
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
  optionsRelation: CrudRelationControllerMixinOptions,
) {
  const basePath = `${options.basePath ?? ''}/${options.name}/{id}/${
    optionsRelation.name
  }`;

  if (!options.properties) options.properties = [];
  // Par default configurer le id et le type de id
  if (!options.id) options.id = 'id';
  if (!options.idType) options.idType = 'number';

  if (!optionsRelation.id) optionsRelation.id = 'id';
  if (!optionsRelation.idType) optionsRelation.idType = 'number';
  if (!optionsRelation.properties) optionsRelation.properties = [];

  // Map pour les API qui sont `disabled`
  let disabledApiMap: {[id: string]: boolean} = {};
  const isDisabled = (call: CrudOperators) => {
    // regarde si desactivé dans la map
    if (disabledApiMap[call]) return true;
    // regarde si desactivé pour le user
    if (
      optionsRelation.disableds &&
      optionsRelation.disableds.indexOf(call) > -1
    )
      return true;
    return false;
  };

  const omitId =
    optionsRelation.omitId === undefined || options.omitId === true
      ? [optionsRelation.id as string]
      : [];

  const parampath = parampathFunction(options.idType, 'id');
  const parampathrelation = parampathFunction(options.idType, 'fk');
  const requestbody = requestBodyDecoratorGetter(repoEntityRelation);

  let findData: (id: any, filter: any) => any;

  let repository: DefaultCrudRepository<any, any, {}> & any;

  const getRelationThings = (id: any) => {
    const relations = repository[optionsRelation.name](id);
    if (!relations) {
      throw new HttpErrors.InternalServerError('Relation not loaded ' + id);
    }
    return relations;
  };

  switch (optionsRelation.accessorType) {
    case 'BelongsTo':
      findData = (id: any) => getRelationThings(id);
      disabledApiMap = {
        create: true,
        findById: true,
        updateById: true,
        deleteById: true,
      };
      break;
    case 'HasOne':
      findData = (id: any) => getRelationThings(id).get();
      disabledApiMap = {
        findById: true,
      };
      break;
    case 'HasMany':
      findData = (id: any, filter: any) => getRelationThings(id).find(filter);
      break;
  }

  class CrudRelationController extends superClass {
    set repository(r: DefaultCrudRepository<any, any, {}> & any) {
      repository = r;
    }
    get repository() {
      return repository;
    }

    // Configure les fonctionsexposer selon le type d'accessor
    validateTypeOfAccessor() {
      const relationAccessor = this.repository[optionsRelation.name];
      if (!relationAccessor) {
        throw new HttpErrors.BadRequest(
          `Relation ${optionsRelation.name} doesn't exist on ${options.name}Repository`,
        );
      }
    }

    @operatorDecorator({
      op: 'GET',
      path: basePath,
      name: repoEntity.name,
      model: repoEntityRelation,
      disabled: isDisabled('find'),
      spec: optionsRelation.specs ? optionsRelation.specs['find'] : undefined,
    })
    @chain(...getDecoratorsProperties(options.properties, 'find'))
    async findRelationModel(
      @parampath() id: IDS,
      @param.query.object('filter') filter?: Filter<ER>,
    ) {
      return findData(id, filter);
    }

    @operatorDecorator({
      op: 'GET',
      path: `${basePath}/{fk}`,
      name: repoEntity.name,
      model: repoEntityRelation,
      disabled: isDisabled('findById'),
      spec: optionsRelation.specs
        ? optionsRelation.specs['findById']
        : undefined,
    })
    @chain(...getDecoratorsProperties(options.properties, 'findById'))
    async getRelationModel(
      @parampath() id: IDS,
      @parampathrelation() fk: IDR,
      @param.query.object('filter') filter: Filter<ER> = {},
    ) {
      const filterCertified = Object.assign(filter, {
        where: {[optionsRelation.id + '']: fk},
      });
      const items = await getRelationThings(id).find(filterCertified);
      if (items.length < 1) {
        throw new HttpErrors.NotFound('Item not found');
      } else if (items.length > 1) {
        throw new HttpErrors.InternalServerError('Too many items');
      }

      return items[0];
    }

    @operatorDecorator({
      op: 'POST',
      path: basePath,
      name: repoEntity.name,
      model: repoEntityRelation,
      disabled: isDisabled('create'),
      spec: optionsRelation.specs ? optionsRelation.specs['create'] : undefined,
    })
    @chain(...getDecoratorsProperties(options.properties, 'create'))
    async createRelationModel(
      @parampath() id: IDS,
      @requestbody({partial: true, exclude: omitId})
      body: Partial<ER>,
    ) {
      return getRelationThings(id).create(body);
    }

    @operatorDecorator({
      op: 'PUT',
      path: `${basePath}/{fk}`,
      name: repoEntity.name,
      model: repoEntityRelation,
      disabled: isDisabled('updateById'),
      spec: optionsRelation.specs
        ? optionsRelation.specs['updateById']
        : undefined,
    })
    @chain(...getDecoratorsProperties(options.properties, 'updateById'))
    async putRelationModelById(
      @parampath() id: IDS,
      @parampathrelation() fk: IDR,
      @requestbody({partial: true}) body: Partial<ER>,
    ) {
      await getRelationThings(id).patch(body, {
        [optionsRelation.id as string | number]: fk,
      });
      return;
    }

    @operatorDecorator({
      op: 'DELETE',
      path: `${basePath}/{fk}`,
      name: repoEntity.name,
      model: repoEntityRelation,
      disabled: isDisabled('deleteById'),
      spec: optionsRelation.specs
        ? optionsRelation.specs['deleteById']
        : undefined,
    })
    @chain(...getDecoratorsProperties(options.properties, 'deleteById'))
    async delRelationModel(@parampath() id: IDS, @parampathrelation() fk: IDR) {
      await getRelationThings(id).delete({
        [optionsRelation.id as string | number]: fk,
      });
      return;
    }
  }

  return CrudRelationController;
}
