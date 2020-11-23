/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor, inject, MixinTarget} from '@loopback/core';
import {
  DefaultCrudRepository,
  Entity,
  CountSchema,
  Count,
  Model,
  Where,
  Filter,
  FilterExcludingWhere,
  Class,
  Repository,
} from '@loopback/repository';
import {
  getModelSchemaRef,
  param,
  requestBody,
  RestApplication,
} from '@loopback/rest';
import {
  chain,
  ControllerMixinOptions,
  getDecoratorsProperties,
} from '../../../helpers';
import {
  operatorDecorator,
  parampathFunction,
  requestBodyDecoratorGetter,
} from './decorator';

export type CrudOperators =
  | 'deleteById'
  | 'replaceById'
  | 'updateById'
  | 'findById'
  | 'updateAll'
  | 'count'
  | 'create'
  | string;

// ModelDef : définition d'une model qui peut être exposé
export type ModelDef = Function & {prototype: any} & typeof Model;

// InjectableRepository est une union des types qui peuvent
// être utilisé pour l'obtention d'une repository
export type InjectableRepository<E extends Entity, ID> =
  | string
  | Class<Repository<Model>>
  | DefaultCrudRepository<E, ID, {}>;

export interface CrudMixinOptions {
  // nom de la ressource pour le path {basepath}/{name}
  name: string;
  // nom de la variable qui correspond a l'identifiant de l'entité
  // par default ID
  id?: string;
  // type de l'identifant
  // par default number
  idType?: string;
  // si le ID est généré automatiquement
  // par default omitId est a true
  omitId?: boolean;
}

// Optons pour un CrudControllerMixin
export interface CrudControllerMixinOptions
  extends ControllerMixinOptions,
    CrudMixinOptions {
  disables?: CrudOperators[];
}

/**
 * Ajoute un CRUD Controller anonyme à partir d'un model qui possède un repository
 */
export const addCRUDController = <E extends Entity, ID>(
  app: RestApplication,
  // classe de l'Entité
  modelDef: ModelDef,
  // paramètre pour l'injection du repository avec @repository()
  repo: InjectableRepository<E, ID>,
  options: CrudControllerMixinOptions,
) => {
  const name =
    typeof repo === 'string'
      ? repo
      : repo instanceof DefaultCrudRepository
      ? 'null'
      : repo.name;

  class Test extends CrudControllerMixin<Constructor<object>, E, ID>(
    Object,
    modelDef,
    options,
  ) {
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

  const binding = app.controller(Test, `${options.name}Controller`);

  return binding.key;
};

/**
 *
 * CrudControllerMixin is a mixin to add all of the CrudOperation
 * to expose youre Repository with a controller. The function added
 * are the same as the default CRUD Controller generated by lb4-cli
 * @param superClass
 * @param repoEntity : Entity of the repository you will use
 * @param options : CrudControllerMixinOptions
 *
 * You must provide value for the following property added by the mixin
 * - repository : DefaultCrudRepository that will be use
 */
export function CrudControllerMixin<
  T extends MixinTarget<object>,
  E extends Entity,
  ID
>(
  superClass: T,
  repoEntity: Function & {prototype: any} & typeof Model,
  options: CrudControllerMixinOptions,
) {
  // base path for binding
  const basePath = `${options.basePath ?? ''}/${options.name}`;

  if (!options.id) options.id = 'id';
  if (!options.idType) options.idType = 'number';

  const omitId =
    options.omitId === undefined || options.omitId === true ? [options.id] : [];

  const isDisable = (funcName: string) =>
    options.disables
      ? options.disables.indexOf(funcName as CrudOperators) > -1
      : false;

  // wrap to use to correct property decorator to get id from request
  const parampath = parampathFunction(options.idType, options.id);
  const requestbody = requestBodyDecoratorGetter(repoEntity);
  class RestController extends superClass {
    repository: DefaultCrudRepository<E, ID, {}>;

    @operatorDecorator({
      op: 'POST',
      path: `${basePath}`,
      name: repoEntity.name,
      model: repoEntity,
      disable: isDisable('create'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async create(
      @requestbody({exclude: omitId})
      profile: Omit<E, 'id'>,
    ): Promise<E> {
      return this.repository.create(profile as any);
    }

    @operatorDecorator({
      op: 'GET',
      path: `${basePath}/count`,
      name: repoEntity.name,
      customSchema: CountSchema,
      disable: isDisable('count'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async count(@param.where(repoEntity) where?: Where<E>): Promise<Count> {
      return this.repository.count(where);
    }

    @operatorDecorator({
      op: 'GET',
      path: `${basePath}`,
      name: repoEntity.name,
      customSchema: {
        type: 'array',
        items: getModelSchemaRef(repoEntity, {includeRelations: true}),
      },
      disable: isDisable('find'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async find(@param.filter(repoEntity) filter?: Filter<E>): Promise<E[]> {
      return this.repository.find(filter);
    }

    @operatorDecorator({
      op: 'PATCH',
      path: `${basePath}`,
      name: repoEntity.name,
      customSchema: CountSchema,
      requestDescription: 'PATCH success count',
      disable: isDisable('updateAll'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async updateAll(
      @requestbody({partial: true})
      profile: E,
      @param.where(repoEntity) where?: Where<E>,
    ): Promise<Count> {
      return this.repository.updateAll(profile, where);
    }

    @operatorDecorator({
      op: 'GET',
      path: `${basePath}/id`,
      name: repoEntity.name,
      customSchema: getModelSchemaRef(repoEntity, {includeRelations: true}),
      disable: isDisable('findById'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async findById(
      @parampath() id: ID,
      @param.filter(repoEntity, {exclude: 'where'})
      filter?: FilterExcludingWhere<E>,
    ): Promise<E> {
      return this.repository.findById(id, filter);
    }

    @operatorDecorator({
      op: 'PATCH',
      path: `${basePath}/id`,
      name: repoEntity.name,
      customSchema: {},
      responseDescription: 'Entity PATCH success',
      disable: isDisable('updateById'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async updateById(
      @param.path.string('id') id: ID,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(repoEntity, {partial: true}),
          },
        },
      })
      profile: E,
    ): Promise<void> {
      await this.repository.updateById(id, profile);
    }

    @operatorDecorator({
      op: 'PUT',
      path: `${basePath}/id`,
      name: repoEntity.name,
      model: repoEntity,
      disable: isDisable('replaceById'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async replaceById(
      @param.path.string('id') id: ID,
      @requestBody() profile: E,
    ): Promise<void> {
      await this.repository.replaceById(id, profile);
    }

    @operatorDecorator({
      op: 'DELETE',
      path: `${basePath}/id`,
      name: repoEntity.name,
      responseDescription: 'DELETE success',
      disable: isDisable('deleteById'),
    })
    @chain(...getDecoratorsProperties(options.properties))
    async deleteById(@param.path.string('id') id: ID): Promise<void> {
      await this.repository.deleteById(id);
    }
  }

  return RestController;
}
