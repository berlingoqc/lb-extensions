import {BindingKey} from '@loopback/core';

import {CasbinAdapter} from './adapter';
export namespace CasbinBindings {
  // Bindings pour la factory d'enforcer
  export const FACTORY = BindingKey.create<object>('casbin.enforcer.factory');

  // Bindings pour le path vers le fichier du model casbin
  export const MODEL_PATH = BindingKey.create<string>('casbin.model.path');

  // Bindings d'une map des fichiers de policies par nom de role, pour FileEnforcerProvider
  export const POLICIES_PATH = BindingKey.create<{[id: string]: string}>(
    'casbin.policies.path',
  );

  export const ADAPTER = BindingKey.create<CasbinAdapter>('casbin.adapter');

  // Bindings pour l'identificant de la ressource accéder
  export const RESOURCE_ID = BindingKey.create<string>('casbin.resourceId');
  // Bindings pour l'object ABAC extrait de la BD
  export const ABAC_OBJECT = BindingKey.create<object>('casbin.abac.object');
  // Bindins pour l'object retourner par la DB pour construire l'object ABAC
  export const FULL_OBJECT = BindingKey.create<object>('casbin.full.object');
}
