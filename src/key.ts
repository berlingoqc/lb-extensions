import {BindingKey} from '@loopback/context';
import {PackageInfo} from './type';
import {SequenceActionFn} from './providers';
import {TokenService} from '@loopback/authentication';

export namespace SSOAuthBindings {
  export const SSO_URL = BindingKey.create<string>('alb.sso.url');
}
export namespace AlbLoopbackAuthBindings {
  export const PACKAGE = BindingKey.create<PackageInfo>('alb.packageinfo');
  export const SEQUENCE_PROVIDER = BindingKey.create<SequenceActionFn>(
    'alb.sequence.provider',
  );
}
export namespace TokenServiceBindings {
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );

  export const TOKEN_QUERY_PARAM_NAME = BindingKey.create<string>(
    'authentication.jwt.queryparam',
  );
}

export namespace AuthorizationBindings {
  export const PROVIDER = BindingKey.create<object>(
    'authorization.casbin-provider',
  );
}
