import {param, HttpErrors} from '@loopback/rest';

export function parampathFunction(idType: string, idName = 'id') {
  return () => {
    return (target: object, member: string, index: number) => {
      switch (idType) {
        case 'string':
          return param.path.string(idName)(target, member, index);
        case 'number':
          return param.path.number(idName)(target, member, index);
        default:
          throw new HttpErrors.UnprocessableEntity(
            'ID must be string or number',
          );
      }
    };
  };
}
