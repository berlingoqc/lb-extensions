import * as casbin from 'casbin';
import {inject, Provider} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CasbinAdapter, LBCasbinAdapter} from '../adapter';
import {CasbinBindings} from '../keys';
import {EnforcerByRoleOrFilter} from '../models';
import {CasbinPolicyRepository} from '../repositories';

/**
 * Provider d'enforcer qui utilise un repository pour stocker les policies
 */
export class RepositoryEnforcerProvider
  implements Provider<EnforcerByRoleOrFilter>
{
  constructor(
    @inject(CasbinBindings.MODEL_PATH)
    private casbinModelPath: string,
    @repository(CasbinPolicyRepository)
    private policyRepository: CasbinPolicyRepository,
    @inject(CasbinBindings.ADAPTER)
    private adapter: CasbinAdapter,
  ) {}

  value(): EnforcerByRoleOrFilter {
    return async (role?: string, subject?: string, filter = {}) => {
      filter.where = {or: []};
      if (role) {
        filter.where.or.push({ptype: 'p', v0: role}, {ptype: 'g', v1: role});
      }
      if (subject) {
        filter.where.or.push({ptype: 'p', v1: subject});
      }
      this.adapter.filter = filter;
      const enforcer = await casbin.newEnforcer();
      await enforcer.initWithAdapter(this.casbinModelPath, this.adapter);

      return enforcer;
    };
  }
}
