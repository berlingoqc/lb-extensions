import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {User} from './model';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(User, dataSource);
  }
}
