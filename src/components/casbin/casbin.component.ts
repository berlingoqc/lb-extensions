import {AuthorizationTags} from '@loopback/authorization';
import {Binding, Component, createServiceBinding} from '@loopback/core';
import {AuthorizationBindings} from '../../key';
import {CasbinAuthorizationProvider} from './providers/casbin-authorizor';
import {CasbinPolicyRepository} from './repositories';
import {PoliciesController} from './controller';
import {RolesService} from './services';
import {CasbinBindings} from './keys';
import {RepositoryEnforcerProvider} from './providers';
import {LBCasbinAdapter} from './adapter';

/**
 * Component pour fournir les fonctionnalités de Casbin.
 *
 * Utilise le RepositoryEnforcer
 * Fournit /policies
 * Fournit provider pour @authorize
 */
export class CasbinComponent implements Component {
  constructor() {}

  controllers = [PoliciesController];

  bindings = [
    createServiceBinding(RolesService),
    Binding.bind('repositories.CasbinPolicyRepository').toClass(
      CasbinPolicyRepository,
    ),
    Binding.bind(CasbinBindings.FACTORY).toProvider(RepositoryEnforcerProvider),
    Binding.bind(AuthorizationBindings.PROVIDER)
      .toProvider(CasbinAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER),
    Binding.bind(CasbinBindings.ADAPTER).toClass(LBCasbinAdapter),
  ];
}
