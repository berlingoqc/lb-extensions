import {Provider} from '@loopback/core';
import {
  Authorizer,
  AuthorizationContext,
  AuthorizationMetadata,
  AuthorizationDecision,
} from '@loopback/authorization';

// Class level authorizer
export class RoleAuthorizationProvider implements Provider<Authorizer> {
  constructor() {}

  /**
   * @returns authenticateFn
   */
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    const roles: string[] = metadata.allowedRoles ?? [];
    const userRoles: string[] = authorizationCtx.principals[0].roles;
    let allow = false;
    roles.forEach((x) => {
      if (userRoles.indexOf(x) > -1) {
        allow = true;
      }
    });
    if (allow) return AuthorizationDecision.ALLOW;
    else if (allow === false) return AuthorizationDecision.DENY;
    return AuthorizationDecision.ABSTAIN;
  }
}
