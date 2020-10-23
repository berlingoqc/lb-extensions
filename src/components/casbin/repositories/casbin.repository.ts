import {DefaultCrudRepository} from '@loopback/repository';
import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {CasbinPolicy} from '../models';

export class CasbinPolicyRepository extends DefaultCrudRepository<
  CasbinPolicy,
  typeof CasbinPolicy.prototype.id,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(CasbinPolicy, dataSource);
  }
}
