import { Provider } from '@loopback/core';
import { OperationArgs, Request, RequestContext } from '@loopback/rest';

export type SequenceActionFn = (req: Request, args: OperationArgs, context: RequestContext) => Promise<void>;



export class SequenceActionProvider implements Provider<SequenceActionFn> {

  constructor() { }

  value(): SequenceActionFn {
    return () => new Promise((r) => r());
  }
}
