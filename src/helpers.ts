/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DecoratorInfo {
  func: any;
  args: any[];
}

export type DecoratorProperties =
  | DecoratorInfo[]
  | {[id: string]: DecoratorInfo[]};

export interface ClassMixinDecoratorInfo {
  properties: DecoratorProperties;
}

export interface ControllerMixinOptions extends ClassMixinDecoratorInfo {
  basePath?: string;
}

export function getPropertie(properties?: DecoratorProperties, name?: string) {
  if (properties instanceof Array) {
    return properties;
  } else if (typeof properties == 'object' && name) return properties[name];
  throw new Error('Get get properties ');
}

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
