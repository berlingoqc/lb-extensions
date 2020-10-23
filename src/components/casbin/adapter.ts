import * as casbin from 'casbin';
import {CasbinPolicy} from './models';
import {CasbinPolicyRepository} from './repositories';

/**
 * Adapater pour casbin qui utilise un Repository loopback
 */
export class LBCasbinAdapter implements casbin.Adapter {
  static DEBUG = require('debug')('alborea:acl:policy');
  constructor(
    private policyRepository: CasbinPolicyRepository,
    private filter = {},
  ) {}

  async loadPolicy(model: casbin.Model): Promise<void> {
    const policies = await this.policyRepository.find(this.filter);
    LBCasbinAdapter.DEBUG(policies);
    policies.forEach((policy) => this.loadPolicyEntry(policy, model));
  }

  savePolicy(model: casbin.Model): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private loadPolicyEntry(policy: CasbinPolicy, model: casbin.Model) {
    const result =
      policy.ptype +
      ', ' +
      [policy.v0, policy.v1, policy.v2, policy.v3, policy.v4, policy.v5]
        .filter((n) => n)
        .join(', ');
    casbin.Helper.loadPolicyLine(result, model);
  }
}
