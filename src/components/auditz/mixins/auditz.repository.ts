/* eslint-disable @typescript-eslint/no-explicit-any */
import {Getter, MixinTarget} from '@loopback/core';
import {
  Entity,
  DefaultCrudRepository,
  EntityCrudRepository,
  Filter,
  DataObject,
  Options,
  Count,
  Where,
} from '@loopback/repository';
import {UserProfile} from '@loopback/security';
import {HttpErrors} from '@loopback/rest';
import {AuditzModel} from './auditz.model';

export interface AuditzRepository<T extends Entity & AuditzModel<ID>, ID>
  extends DefaultCrudRepository<T, ID, {}> {
  // find sur les éléments qui ont été SoftDeleted
  findSoftDeleted(filter?: any, options?: object): Promise<T[]>;
  // restore un élément qui était SoftDeleted
  restoreByIdSoftDeleted(id: ID): Promise<void>;
  // supprime définitivement un élément
  hardDeleteById(id: ID): Promise<void>;
}

export interface AuditzRepositorySettings {
  // Activé par default si non spécifié
  softDeleted?: boolean;
  // Si on sauvegarde les informations dans la table de révision
  // false par default
  revision?: boolean;
}

function validateFilterRequiredField(filter?: any): Filter {
  if (!filter) {
    filter = {};
  }
  if (!filter.where) {
    filter.where = {};
  }
  return filter;
}

function modifyFilterForRequest(filter?: any): Filter {
  filter = validateFilterRequiredField(filter);
  filter.where = modifyWhereForRequest(filter.where);

  return filter;
}

function modifyWhereForRequest(where: any): Where {
  where['deletedBy'] = null;
  return where;
}

/**
 * Mixin pour executés les opération d'audits dans
 * un repository sur une entitée qui utilise le model
 * mixin AuditzModelMixin
 * implémente AuditzRepository
 * @param superClass
 */
export function AuditzRepositoryMixin<
  T extends Entity & AuditzModel<ID>,
  ID,
  R extends MixinTarget<EntityCrudRepository<any, ID, {}>>
>(superClass: R, settings: AuditzRepositorySettings = {}) {
  const softDelete =
    settings.softDeleted == null ||
    settings.softDeleted === undefined ||
    settings.softDeleted === true;
  class MixedRepository extends superClass {
    // Implémentation de AuditzRepositoryExtraFunction
    userGetter: Getter<UserProfile>;

    findSoftDeleted(filter?: any, options?: object) {
      filter = modifyFilterForRequest(filter);
      filter.where['deletedBy'] = {neq: null};
      return super.find(filter, options);
    }

    async restoreByIdSoftDeleted(id: ID): Promise<void> {
      const user = await this.userGetter();
      return super.updateById(id, {
        deletedAt: null,
        deletedBy: null,
        updatedBy: user.id,
        updatedAt: new Date(),
      } as any);
    }

    hardDeleteById(id: ID): Promise<void> {
      return super.deleteById(id);
    }

    // OVERRIDE
    find = async (filter?: Filter, options?: object) => {
      return super.find(modifyFilterForRequest(filter) as any, options);
    };

    findById = async (id: ID, filter?: any, options?: object) => {
      filter = validateFilterRequiredField(filter);
      filter.where['id'] = id;
      const data = await this.find(filter, options);
      if (!data || data.length === 0) {
        throw new HttpErrors.NotFound('Not found');
      }

      return data[0];
    };

    create = async (entity: DataObject<T>, options?: Options) => {
      const user = await this.userGetter();
      entity.createdBy = user.id;
      entity.createdAt = new Date();
      return super.create(entity, options);
    };
    createAll = async (
      entities: DataObject<T>[],
      options?: Options,
    ): Promise<T[]> => {
      const user = await this.userGetter();
      entities.forEach((entity) => {
        entity.createdBy = user.id;
        entity.createdAt = new Date();
      });
      return super.createAll(entities, options);
    };
    save = async (entity: T, options?: Options): Promise<T> => {
      const user = await this.userGetter();
      entity.createdBy = user.id;
      entity.createdAt = new Date();
      return super.save(entity, options);
    };
    update = async (entity: T, options?: Options): Promise<void> => {
      const user = await this.userGetter();
      entity.updatedAt = new Date();
      entity.updatedBy = user.id;
      return super.update(entity, options);
    };
    delete = async (entity: T, options?: Options): Promise<void> => {
      const user = await this.userGetter();
      entity.deletedAt = new Date();
      entity.deletedBy = user.id;
      return super.update(entity, options);
    };

    updateAll = async (
      data: DataObject<T>,
      where?: Where<T>,
      options?: Options,
    ): Promise<Count> => {
      const user = await this.userGetter();
      data.updatedAt = new Date();
      data.updatedBy = user.id;
      return super.updateAll(data, where, options);
    };
    updateById = async (
      id: ID,
      data: DataObject<T>,
      options?: Options,
    ): Promise<void> => {
      const user = await this.userGetter();
      data.updatedAt = new Date();
      data.updatedBy = user.id;
      return super.updateById(id, data, options);
    };
    replaceById = async (
      id: ID,
      data: DataObject<T>,
      options?: Options,
    ): Promise<void> => {
      const user = await this.userGetter();
      data.updatedAt = new Date();
      data.updatedBy = user.id;
      return super.replaceById(id, data, options);
    };

    deleteAll = async (where?: Where<T>, options?: Options): Promise<Count> => {
      const user = await this.userGetter();
      if (softDelete) {
        const entity = {
          deletedBy: user.id,
          deletedAt: new Date(),
        };
        return super.updateAll(entity, where, options);
      }
      return super.deleteAll(where, options);
    };
    deleteById = async (id: ID, options?: Options): Promise<void> => {
      const user = await this.userGetter();
      if (settings.softDeleted) {
        return super.updateById(
          id,
          {
            deletedBy: user.id,
            deletedAt: new Date(),
          },
          options,
        );
      } else {
        return super.deleteById(id, options);
      }
    };
  }
  return MixedRepository;
}
