import {Constructor, Getter, inject, service} from '@loopback/core';
import {juggler, DefaultCrudRepository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {CasbinPolicy} from '../models';
import {AuditzRepositoryMixin} from '../../auditz/mixins/auditz.repository';
import {RevisionService} from '../../auditz/services';

export class CasbinPolicyRepository extends AuditzRepositoryMixin<
  CasbinPolicy,
  typeof CasbinPolicy.prototype.id,
  Constructor<
    DefaultCrudRepository<CasbinPolicy, typeof CasbinPolicy.prototype.id, {}>
  >
>(DefaultCrudRepository, {
  revision: true,
  table: 'CasbinPolicy',
}) {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
    @inject.getter(SecurityBindings.USER)
    userGetter: Getter<UserProfile>,
    @service(RevisionService)
    revisionService: RevisionService,
  ) {
    super(CasbinPolicy, dataSource);
    this.userGetter = userGetter;
    this.revisionService = revisionService;
  }
}
