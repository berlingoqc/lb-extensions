import {MixinTarget} from '@loopback/core';
import {property, Model} from '@loopback/repository';

/**
 * Interface des champs présent lors de l'ajout de AuditzModelMixin
 */
export interface AuditzModel<P> {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  createdBy: P;
  updatedBy: P;
  deletedBy: P;
}

/**
 * Mixin factory pour le model de Auditz
 * qui ajoute des champs pour auditer
 * les modifications sur une table
 *
 * @param superClass - Class de Basee
 * @typeParam T - Model de la class
 */
export function AuditzModelMixin<T extends MixinTarget<Model>>(superClass: T) {
  class MixedModel extends superClass implements AuditzModel<number> {
    @property()
    createdAt: Date;

    @property()
    updatedAt: Date;

    @property()
    deletedAt: Date;

    @property()
    createdBy: number;

    @property()
    updatedBy: number;

    @property()
    deletedBy: number;
  }

  return MixedModel;
}
