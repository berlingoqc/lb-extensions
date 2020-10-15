/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {inject, Provider} from '@loopback/core';
import {getSubjectFromId} from '../helpers';
import {CasbinBindings} from '../keys';
import {EnforcerByRoleOrFilter} from '../models';

/**
 * Provider pour le decorator @authorize qui valide avec casbin l'accès a la
 * ressource.
 *
 * Si des ressource sont fournis avec allowedRoles , la rechercher va être réduite
 * pour seulement inclure les roles dans la recherches , si rien n'est fournis va
 * chercher dans l'ensemble des policy.
 */
export class CasbinAuthorizationProvider implements Provider<Authorizer> {
  static DEFAULT_SCOPE = 'execute';
  static DEBUG = require('debug')('alborea:acl:enforcer');
  constructor(
    @inject(CasbinBindings.FACTORY)
    private enforcerFactory: EnforcerByRoleOrFilter,
  ) {}

  /**
   * @returns authenticateFn
   */
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    const resourceId = await authorizationCtx.invocationContext.get(
      CasbinBindings.RESOURCE_ID,
      {optional: true},
    );

    const object: any =
      (await authorizationCtx.invocationContext.get(
        CasbinBindings.ABAC_OBJECT,
        {
          optional: true,
        },
      )) ?? {};
    object.Name = resourceId ?? metadata.resource ?? authorizationCtx.resource;

    const request = {
      subject: getSubjectFromId(authorizationCtx.principals[0].id),
      object,
      action: metadata.scopes?.[0] ?? CasbinAuthorizationProvider.DEFAULT_SCOPE,
    };

    const allowedRoles = metadata.allowedRoles;

    CasbinAuthorizationProvider.DEBUG(
      `authorizer request: ${JSON.stringify(
        request,
      )} , allowedRoles: ${allowedRoles}`,
    );

    let allow = false;

    if (allowedRoles) {
      for (const role of allowedRoles) {
        allow = await this.allowByRole(request, role);
        if (allow) {
          break;
        }
      }
    } else {
      allow = await this.allowByRole(request);
    }

    CasbinAuthorizationProvider.DEBUG('final result: ', allow);

    if (allow) return AuthorizationDecision.ALLOW;
    else if (allow === false) return AuthorizationDecision.DENY;
    return AuthorizationDecision.ABSTAIN;
  }

  private async allowByRole(request: any, role?: string): Promise<boolean> {
    const enforcer = await this.enforcerFactory(role);
    if (!enforcer) return false;

    const allowedByRole = await enforcer.enforce(
      request.subject,
      request.object,
      request.action,
    );

    CasbinAuthorizationProvider.DEBUG(
      `authorizer role: ${role}, result: ${allowedByRole}`,
    );

    return allowedByRole;
  }
}
