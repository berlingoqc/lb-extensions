/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DefaultCrudRepository,
  Entity,
  Model,
  Class,
  Repository,
} from '@loopback/repository';
import {OperationObject} from '@loopback/rest';
import {ControllerMixinOptions} from '../../../helpers';

// Liste des opérations fournies par les CrudController
export type CrudOperators =
  | 'find'
  | 'deleteById'
  | 'replaceById'
  | 'updateById'
  | 'findById'
  | 'updateAll'
  | 'count'
  | 'create';

// ModelDef : définition d'un modèle qui peut être exposé
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
  specs?: {[id in CrudOperators]: OperationObject};
}

// Définition de la relation d'un model a exposer
export interface ModelRelation {
  // Définition du Model
  modelRelationDef: ModelDef;
  // Options pour le controller
  optionsRelation: CrudControllerMixinOptions;
}

// Model pour définir une model avec ses relations à exposer
export class CrudModelWithRelations {
  model: ModelDef;
  repo: InjectableRepository<any, any>;
  options: CrudControllerMixinOptions;
  relations: ModelRelation[];
}
