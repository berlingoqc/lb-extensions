import * as casbin from 'casbin';
import {bind, BindingScope, inject} from '@loopback/core';
import {CasbinBindings} from '../keys';
import {EnforcerByRoleOrFilter} from '../models';
import {getSubjectFromId} from '../helpers';

/**
 * Service pour exposer les fonctionnalités de rôles fournies par Casbin
 * avec un enforcer pour le contexte
 */
@bind({scope: BindingScope.TRANSIENT})
export class RolesService {
  constructor(
    @inject(CasbinBindings.FACTORY)
    private enforcerFactory: EnforcerByRoleOrFilter,
  ) {}

  async getJSPermissionForUser(id: number): Promise<{perm: string}> {
    const subject = getSubjectFromId(id);
    const enforcer = await this.enforcerFactory('', '', {});
    if (enforcer) {
      return {
        perm: await casbin.casbinJsGetPermissionForUser(enforcer, subject),
      };
    }
    throw new Error('No enforcer found');
  }

  async getUserRole(id: number, implicit = false): Promise<string[]> {
    const subject = getSubjectFromId(id);
    const enforcer = await this.enforcerFactory('', subject, {
      where: {
        and: [
          {
            ptype: 'g',
            v0: subject,
          },
        ],
      },
    });
    if (enforcer) {
      return implicit
        ? enforcer.getRolesForUser(subject)
        : enforcer.getImplicitRolesForUser(subject);
    }
    throw new Error('No enforcer found');
  }
}
