import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Entity} from '@loopback/repository';
import {Constructor, MixinTarget} from '@loopback/core';
import {del, get, param, patch} from '@loopback/rest';
import {voterInjectRessourceId} from '../../casbin/helpers';
import {AuditzRepository} from './auditz.repository';
import {AuditzModel} from './auditz.model';

/**
 * Options pour l'instanciation de AuditzControllerMixin
 */
export interface AuditzControllerOptions {
  // ID de la ressource pour l'authorization
  ressource: string;
  // Path de base pour les endpoints
  basePath: string;
  // Classe du modèle exposé pour les schémas OpenAPI
  modelClass?: Constructor<object>;
  // Rôles pouvant accéder au endpoint
  roles?: string[];
}

/**
 *  Mixin pour ajouter des endpoints pour
 *  accéder au éléments suivants:
 *
 *  - Opération sur les éléments supprimés
 *  -
 * @param superClass
 * @param options
 */
export function AuditzControllerMixin<
  M extends Entity & AuditzModel<ID>,
  ID,
  T extends MixinTarget<object>
>(superClass: T, options: AuditzControllerOptions) {
  const voterSubject = voterInjectRessourceId(0);
  class MixedController extends superClass {
    // Doit être founi par la classe enfant
    repository: AuditzRepository<M, ID>;

    @get(`${options.basePath}/restore`)
    @authenticate('jwt')
    @authorize({
      resource: options.ressource,
      scopes: ['deleteById'],
      allowedRoles: options.roles,
    })
    async findSoftDeleted(): Promise<M[]> {
      return this.repository.findSoftDeleted({});
    }

    @patch(`${options.basePath}/restore/{id}`)
    @authenticate('jwt')
    @authorize({
      resource: options.ressource,
      scopes: ['updateById'],
      allowedRoles: options.roles,
    })
    async restoreDeleted(@param.path.string('id') id: ID): Promise<void> {
      return this.repository.restoreByIdSoftDeleted(id);
    }

    @del(`${options.basePath}/restore/{id}`)
    @authenticate('jwt')
    @authorize({
      resource: options.ressource,
      scopes: ['deleteById'],
      allowedRoles: options.roles,
      voters: [voterSubject],
    })
    delete(@param.path.string('id') id: ID): Promise<void> {
      return this.repository.hardDeleteById(id);
    }
  }

  return MixedController;
}
