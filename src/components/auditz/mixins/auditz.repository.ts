/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor, Getter, MixinTarget} from '@loopback/core';
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
import {RevisionService} from '../services/revision';

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
  // Nom de la table qu'on applique le mixin
  // nécessaire pour revision a true
  table?: string;
  // Affiche les informations d'auditz lors des finds si true
  hideAuditzData?: boolean;
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

function modifyFilterForRequest(filter?: any, hideData = true): Filter {
  filter = validateFilterRequiredField(filter);
  filter.where = modifyWhereForRequest(filter.where);
  if (hideData) {
    filter.fields = {
      createdAt: false,
      createdBy: false,
      updatedBy: false,
      updatedAt: false,
      deletedBy: false,
      deletedAt: false,
    };
  }
  return filter;
}

function modifyWhereForRequest(where: any): Where {
  where['deletedBy'] = null;
  return where;
}

/**
 * Mixin pour executer les opérations d'audits dans
 * un repository sur une entitée qui utilise le model
 * mixin AuditzModelMixin
 * implémente AuditzRepository
 * @param superClass
 */
export function AuditzRepositoryMixin<
  T extends Entity & AuditzModel<ID>,
  ID,
  R extends MixinTarget<EntityCrudRepository<T, ID, {}>> = Constructor<
    DefaultCrudRepository<T, ID, {}>
  >
>(superClass: R, settings: AuditzRepositorySettings = {}) {
  const softDelete =
    settings.softDeleted == null ||
    settings.softDeleted === undefined ||
    settings.softDeleted === true;
  if (settings.revision && !settings.table) {
    throw new Error('Revision is activated but no table name is provided');
  }
  const table = settings.table ?? '';
  const hide = settings.hideAuditzData ?? true;
  class MixedRepository extends superClass {
    // Implémentation de AuditzRepositoryExtraFunction

    // Doit être fournis par la classe enfant
    userGetter: Getter<UserProfile>;
    // Doit être fournis optionnelement si on active révision
    revisionService: RevisionService;

    findSoftDeleted(filter?: any, options?: object) {
      filter = modifyFilterForRequest(filter, hide);
      filter.where['deletedBy'] = {neq: null};
      return super.find(filter, options);
    }

    async restoreByIdSoftDeleted(id: ID): Promise<void> {
      const user = await this.userGetter();
      if (settings.revision) {
        await this.revisionService.onRestore(table, id as any);
      }
      await super.updateById(id, {
        deletedAt: null,
        deletedBy: null,
        updatedBy: user.id,
        updatedAt: new Date(),
      } as any);
    }

    async hardDeleteById(id: ID): Promise<void> {
      await super.deleteById(id);
      if (settings.revision) {
        await this.revisionService.onHardDelete(table, id as any);
      }
    }

    // OVERRIDE
    find = async (filter?: Filter, options?: object) => {
      return super.find(modifyFilterForRequest(filter, hide) as any, options);
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
      entity.updatedAt = new Date();
      entity.updatedBy = user.id;
      const data = await super.create(entity, options);
      if (settings.revision)
        await this.revisionService.onCreate(table, data, data.getId());
      return data;
    };

    createAll = async (
      entities: DataObject<T>[],
      options?: Options,
    ): Promise<T[]> => {
      const user = await this.userGetter();
      entities.forEach((entity) => {
        entity.createdBy = user.id;
        entity.createdAt = new Date();
        entity.updatedBy = user.id;
        entity.updatedAt = new Date();
      });
      const datas = await super.createAll(entities, options);
      if (settings.revision) {
        for (const data of datas) {
          await this.revisionService.onCreate(table, data, data.getId());
        }
      }
      return datas;
    };

    save = async (entity: T, options?: Options): Promise<T> => {
      const user = await this.userGetter();
      entity.createdBy = user.id;
      entity.createdAt = new Date();
      const data = await super.save(entity, options);
      if (settings.revision) {
        await this.revisionService.onCreate(table, data, data.getId());
      }
      return data;
    };

    // UPDATE

    update = async (entity: T, options?: Options): Promise<void> => {
      const user = await this.userGetter();
      entity.updatedAt = new Date();
      entity.updatedBy = user.id;
      if (settings.revision) {
        await this.revisionService.onUpdate(table, entity, entity.getId());
      }
      await super.update(entity, options);
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
      if (settings.revision) {
        await this.revisionService.onUpdate(table, data, id as any);
      }
      await super.updateById(id, data, options);
    };
    replaceById = async (
      id: ID,
      data: DataObject<T>,
      options?: Options,
    ): Promise<void> => {
      const user = await this.userGetter();
      data.updatedAt = new Date();
      data.updatedBy = user.id;
      await super.replaceById(id, data, options);
      if (settings.revision) {
        await this.revisionService.onReplace(table, data, id as any);
      }
    };

    delete = async (entity: T, options?: Options): Promise<void> => {
      const user = await this.userGetter();
      if (softDelete) {
        entity.deletedAt = new Date();
        entity.deletedBy = user.id;
        await super.update(entity, options);
      } else {
        await super.delete(entity, options);
      }
      if (settings.revision) {
        await this.revisionService.onDelete(table, entity, entity.getId());
      }
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
        await super.updateById(
          id,
          {
            deletedBy: user.id,
            deletedAt: new Date(),
          },
          options,
        );
      } else {
        await super.deleteById(id, options);
      }
      if (settings.revision) {
        await this.revisionService.onDelete(table, {}, id as any);
      }
    };
  }
  return MixedRepository;
}
