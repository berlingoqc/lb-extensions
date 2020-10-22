import {Constructor, Getter, inject} from '@loopback/core';
import {juggler, DefaultCrudRepository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {CasbinPolicy} from '../models';
import {AuditzRepositoryMixin} from '../../auditz/mixins/auditz.repository';

export class CasbinPolicyRepository extends AuditzRepositoryMixin<
  CasbinPolicy,
  typeof CasbinPolicy.prototype.id,
  Constructor<
    DefaultCrudRepository<CasbinPolicy, typeof CasbinPolicy.prototype.id, {}>
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
    @inject.getter(SecurityBindings.USER)
    userGetter: Getter<UserProfile>,
  ) {
    super(CasbinPolicy, dataSource);
    this.userGetter = userGetter;
  }
}
