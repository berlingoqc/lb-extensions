import { Provider } from '@loopback/core';
import {
  Authorizer,
  AuthorizationContext,
  AuthorizationMetadata,
  AuthorizationDecision,
} from '@loopback/authorization';


// Class level authorizer
export class RoleAuthorizationProvider implements Provider<Authorizer> {
  constructor() { }

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
    const roles = metadata.allowedRoles ?? [];
    const userRole = authorizationCtx.principals[0].role;
    let allow = false;
    if (userRole === 'ADMIN') {
      allow = true;
    } else {
      allow = userRole.role === roles[0];
    }

    if (allow) return AuthorizationDecision.ALLOW;
    else if (allow === false) return AuthorizationDecision.DENY;
    return AuthorizationDecision.ABSTAIN;
  }
}
