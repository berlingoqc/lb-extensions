/* eslint-disable @typescript-eslint/naming-convention */
import {
  param,
  HttpErrors,
  requestBody,
  getModelSchemaRef,
  operation,
} from '@loopback/rest';
import {ModelDef} from './model';

/**
 * Contient des decorateur et des functions qui génères
 * des décorateur pour simplifier les decorateur de @loopback/rest
 */

const defaultResponseDescription = {
  POST: (name: string) => ``,
  GET: (name: string) => ``,
  PUT: (name: string) => ``,
  DELETE: (name: string) => ``,
  PATCH: (name: string) => ``,
};

const defaultRequestDescription = {
  POST: (name: string) => `Create a new instance of ${name}`,
  GET: (name: string) => `Get a filter list of ${name}`,
  PUT: (name: string) => `Update a instance of ${name}`,
  DELETE: (name: string) => `Delete a instance of ${name}`,
  PATCH: (name: string) => `Replace a instance of ${name}`,
};

// Fonction qui wrap autour de param.path{string,number} pour
// des utilisation dynamiques.
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

// Decorator to add to an operation that
// you don't wont to be enable
export function disable() {
  return (target: any, key: string, descriptor: any) => {
    descriptor.value = function () {
      throw new HttpErrors.NotExtended();
    };

    return descriptor;
  };
}

export function operatorDecorator(opts: {
  op: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  name: string;
  model?: ModelDef;
  customSchema?: any;
  additionalResponses?: any;
  requestDescription?: string;
  responseDescription?: string;
  disable?: boolean;
}) {
  if (opts.disable) return () => {};
  const spec = {
    'x-controller-name': `${opts.name}Controller`,
    description:
      opts.requestDescription ?? defaultRequestDescription[opts.op](opts.name),
    responses: {
      '200': {
        description:
          opts.responseDescription ??
          defaultResponseDescription[opts.op](opts.name),
        content: {
          'application/json': {
            schema:
              opts.customSchema ??
              (opts.model ? getModelSchemaRef(opts.model) : {}),
          },
        },
      },
    },
  };
  if (opts.additionalResponses) {
    spec.responses = Object.assign(spec.responses);
  }
  return operation(opts.op, opts.path, spec);
}

export function requestBodyDecoratorGetter(model: ModelDef) {
  return (opts?: {partial?: boolean; exclude?: string[]; title?: string}) => {
    return requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(model, {
            title: opts?.title ?? ``,
            partial: opts?.partial,
            exclude: opts?.exclude ?? [],
          }),
        },
      },
    });
  };
}
