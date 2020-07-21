/* eslint-disable @typescript-eslint/no-explicit-any */
import { MixinTarget, Application } from '@loopback/core';
import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import { AuthorizationComponent, AuthorizationTags } from '@loopback/authorization';
import { RoleAuthorizationProvider } from '../providers';
import { RestApplication } from '@loopback/rest';
import { AuthenticationSequence } from '../sequence';
import { RestExplorerBindings, RestExplorerComponent } from '@loopback/rest-explorer';
import { SECURITY_SCHEME_SPEC } from '../utils';
import { SequenceActionComponent } from '../components/sequence.component';
import { JWTRemoteStrategy, JWTAuthenticationStrategy } from '../strategies';
import { AlbLoopbackAuthComponent } from '../components';


export function AlbAuthMixin<T extends MixinTarget<Application>>(superClass: T) {
  return class extends superClass {
    constructor(...args: any[]) {
      super(...args);
      console.log('INITITALIZE AlbAuthMixin');

      this.component(AuthenticationComponent);
      this.component(AuthorizationComponent);
      this.component(SequenceActionComponent);

      this.bind('authorization.casbin-provider')
        .toProvider(RoleAuthorizationProvider)
        .tag(AuthorizationTags.AUTHORIZER);

      if (this.options.strategy === 'local') {
        registerAuthenticationStrategy(this as any, JWTAuthenticationStrategy);
      } else if (this.options.strategy === 'remote') {
        this.component(AlbLoopbackAuthComponent);
        registerAuthenticationStrategy(this as any, JWTRemoteStrategy);
      } else {
        throw new Error('Invalide strategy in options must be local or remote');
      }

      this.initRestApplication(this as any);
      this.initBootMixin(this);
    }

    initRestApplication(restApplication: RestApplication) {
      restApplication.api({
        openapi: '3.0.0',
        info: {
          title: this.options.pkg.name,
          version: this.options.pkg.version,
          description: this.options.pkg.description,
        },
        paths: {},
        components: { securitySchemes: SECURITY_SCHEME_SPEC },
        servers: [{ url: '/api' }],
      });

      restApplication.sequence(AuthenticationSequence as any);

      // Customize @loopback/rest-explorer configuration here
      this.bind(RestExplorerBindings.CONFIG).to({
        path: '/explorer',
      });
      this.component(RestExplorerComponent);
    }

    initBootMixin(app: any) {
      app.projectRoot = this.options.dirname;
      console.log(app.projectRoot);
      // Customize @loopback/boot Booter Conventions here
      app.bootOptions = {
        controllers: {
          // Customize ControllerBooter Conventions here
          dirs: ['controllers'],
          extensions: ['.controller.js'],
          nested: true,
        },
      };
    }
  }
}
