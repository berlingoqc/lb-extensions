import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Revision} from '../models';

export class RevisionRepository extends DefaultCrudRepository<
  Revision,
  typeof Revision.prototype.id,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(Revision, dataSource);
  }
}
