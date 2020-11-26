/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  param,
  HttpErrors,
  requestBody,
  getModelSchemaRef,
  operation,
  OperationObject,
  ResponsesObject,
  SchemaObject,
  ReferenceObject,
} from '@loopback/rest';
import {ModelDef} from './model';

/**
 * Ce fichier contient l'ensemble des décorateurs utilisés.
 * Principalement dans le but de simplifier les décorateur du
 * package @loopback/rest
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
  PUT: (name: string) => `Replace a instance of ${name}`,
  DELETE: (name: string) => `Delete a instance of ${name}`,
  PATCH: (name: string) => `Update a instance of ${name}`,
};

// Fonction qui wrap autour de param.path{string,number} pour
// des utilisations dynamiques.
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
// you want disabled
export function disable() {
  return (target: any, key: string, descriptor: any) => {
    descriptor.value = function () {
      throw new HttpErrors.NotExtended();
    };

    return descriptor;
  };
}

export function operatorDecorator(opts: {
  // Type d'opération
  op: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';
  // Path ou residera l'API
  path: string;
  // Nom de la fonction
  name: string;
  // Le modèle qui est retourné (utiliser si pas de customSchema)
  model?: ModelDef;
  // Schema custom utilisé en priorité sur model
  customSchema?: SchemaObject | ReferenceObject;
  // Réponse additionelle qui sera ajoutée
  additionalResponses?: ResponsesObject;
  // Http status code par default pour la request (200 par default)
  defaultResponse?: string;
  // Description de la request
  requestDescription?: string;
  // Description de la response générer
  responseDescription?: string;
  // Si disable l'api ne sera pas exposer
  disabled?: boolean;
  // OperationObject qui sera merge avec
  // l'object générer pour permettre de rajouter ou de overwrite les propriétés
  spec?: OperationObject;
}) {
  if (opts.disabled) return () => {};
  let spec: OperationObject = {
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
    spec.responses = Object.assign(spec.responses, opts.additionalResponses);
  }
  if (opts.spec) {
    spec = Object.assign(spec, opts.spec);
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
