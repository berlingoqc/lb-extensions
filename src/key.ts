import { BindingKey } from "@loopback/context";


export namespace AlbLoopbackAuthBindings {
  export const SSO_URL = BindingKey.create<string>(
    'alb.sso.url'
  );
}
