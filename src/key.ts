import { BindingKey } from "@loopback/context";
import { SequenceActionFn } from './providers/sequence';


export namespace AlbLoopbackAuthBindings {
  export const SSO_URL = BindingKey.create<string>(
    'alb.sso.url'
  );

  export const SEQUENCE_PROVIDER = BindingKey.create<SequenceActionFn>('alb.sequence.provider');
}
