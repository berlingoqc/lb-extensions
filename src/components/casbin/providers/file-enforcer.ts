import * as casbin from 'casbin';
import {inject, Provider} from '@loopback/core';
import {CasbinBindings} from '../keys';
import {EnforcerByRoleOrFilter} from '../models';

/**
 * Provider d'enforcer qui utilise comme adapter les fichiers CSV
 * Il faut fournir avec POLICIES_PATH { role1: "./fichier.csv"}
 */
export class EnforcerFactoryProvider
  implements Provider<EnforcerByRoleOrFilter> {
  constructor(
    @inject(CasbinBindings.MODEL_PATH)
    private casbinModelPath: string,
    @inject(CasbinBindings.POLICIES_PATH)
    private casbinPolicesPath: {[id: string]: string},
  ) {}

  value(): EnforcerByRoleOrFilter {
    return async (name?: string) => {
      const CASBIN_ENFORCERS: {
        [key: string]: Promise<casbin.Enforcer>;
      } = Object.keys(this.casbinPolicesPath).reduce(
        (p, c) => ({
          ...p,
          ...{[c]: this.createEnforcerByRole(this.casbinPolicesPath[c])},
        }),
        {},
      );
      if (name && Object.prototype.hasOwnProperty.call(CASBIN_ENFORCERS, name))
        return CASBIN_ENFORCERS[name];
      return undefined;
    };
  }

  private createEnforcerByRole(policyPath: string) {
    return casbin.newEnforcer(this.casbinModelPath, policyPath);
  }
}
