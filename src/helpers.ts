/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DecoratorInfo est l'information d'un decorateur
 * qu'on va vouloir venir insérer sur un élément
 *
 * ex: @authenticate('jwt') -> {func: authenticate, args: ['jwt']}
 */
export interface DecoratorInfo {
  func: Function; // Function d'un decorateur
  args: any[]; // Argument pour executer la function
}

// Collection de decorateur pour les propriétés d'une class ou pour une fonction
export type DecoratorProperties =
  | DecoratorInfo[] // Si DecoratorInfo[] utilise la liste pour chacqu'une des propriétés
  | {[id: string]: DecoratorInfo[]}; // Map avec une entrée pour chaque propriétés qu'on veut venir appliqué des décorateurs

/**
 * Options de base pour des Mixins qui target une classe
 */
export interface ClassMixinDecoratorOptions {
  properties: DecoratorProperties;
}

/**
 * Options de base pour les ControllerMixins
 */
export interface ControllerMixinOptions extends ClassMixinDecoratorOptions {
  basePath?: string;
}

/**
 * Retourne les decorateurs a utilisé pour une propriétés
 * depuis un DecoratorProperties
 *
 * throw une erreur si vous passé une Map sans name
 * @param properties
 * @param name
 */
export function getDecoratorsProperties(
  properties?: DecoratorProperties,
  name?: string,
) {
  if (properties instanceof Array) {
    return properties;
  } else if (typeof properties == 'object' && name) return properties[name];
  throw new Error('Cant get decorator property no name provided with Map');
}

/**
 * chain : passe une liste de decorateur qui seront wrapper ensemble dans
 * l'ordre de la liste.
 * @param infos
 */
export function chain(...infos: DecoratorInfo[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    for (const info of infos) {
      info.func(...info.args)(target, propertyKey, descriptor);
    }
  };
}
