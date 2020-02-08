import { AuthenticationComponent, registerAuthenticationStrategy } from "@loopback/authentication";
import { AuthorizationComponent, AuthorizationTags } from "@loopback/authorization";
import { RoleAuthorizationProvider } from "./providers";
import { JWTRemoteStrategy } from "./strategies";
import { AuthenticationSequence } from "./sequence";
import { AlbLoopbackAuthBindings } from "./key";



export interface AlbAuthSettings {
  url: string;
}

export function bootstrap(app: any, settings: AlbAuthSettings) {
  // bind authentification related shit
  app.component(AuthenticationComponent);
  app.component(AuthorizationComponent);


  // authorization
  app.bind('authorizationProviders.casbin-provider')
    .toProvider(RoleAuthorizationProvider)
    .tag(AuthorizationTags.AUTHORIZER);


  // authentication
  registerAuthenticationStrategy(app, JWTRemoteStrategy as any);

  // Set up the custom sequence
  app.sequence(AuthenticationSequence);

  // bind url backend
  app.bind(AlbLoopbackAuthBindings.SSO_URL).to(settings.url);
}
