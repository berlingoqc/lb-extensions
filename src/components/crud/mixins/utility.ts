import {CrudControllerMixinOptions} from './crud.controller';
import {param, HttpErrors} from '@loopback/rest';

export function parampathFunction(options: CrudControllerMixinOptions) {
  return () => {
    return (target: object, member: string, index: number) => {
      switch (options.idType) {
        case 'string':
          return param.path.string(options.id as string)(target, member, index);
        case 'number':
          return param.path.number(options.id as string)(target, member, index);
        default:
          throw new HttpErrors.UnprocessableEntity(
            'ID must be string or number',
          );
      }
    };
  };
}
