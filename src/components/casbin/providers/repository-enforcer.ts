import * as casbin from 'casbin';
import {inject, Provider} from '@loopback/core';
import {repository} from '@loopback/repository';
import {LBCasbinAdapter} from '../adapter';
import {CasbinBindings} from '../keys';
import {EnforcerByRoleOrFilter} from '../models';
import {CasbinPolicyRepository} from '../repositories';

/**
 * Provider d'enforcer qui utilise un repository pour stocker les policies
 */
export class RepositoryEnforcerProvider
  implements Provider<EnforcerByRoleOrFilter> {
  constructor(
    @inject(CasbinBindings.MODEL_PATH)
    private casbinModelPath: string,
    @repository(CasbinPolicyRepository)
    private policyRepository: CasbinPolicyRepository,
  ) {}

  value(): EnforcerByRoleOrFilter {
    return async (
      role?: string,
      subject?: string,
      filter = {
        where: {
          or: [
            {
              // get les policy qui sont pour le role demander
              ptype: 'p',
              v0: role,
            },
            {
              // get les groupes qui herite du role demander
              ptype: 'g',
              v1: role,
            },
            {
              // get les groupes du subject
              ptype: 'g',
              v0: subject,
            },
          ],
        },
      },
    ) => {
      const adapter = new LBCasbinAdapter(this.policyRepository, filter);
      const enforcer = await casbin.newEnforcer();
      await enforcer.initWithAdapter(this.casbinModelPath, adapter);

      return enforcer;
    };
  }
}