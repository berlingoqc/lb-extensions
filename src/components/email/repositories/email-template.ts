import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {EmailTemplate, EmailTemplateRelations} from '../models';
import {inject} from '@loopback/core';

export class EmailTemplateRepository extends DefaultCrudRepository<
  EmailTemplate,
  typeof EmailTemplate.prototype.key,
  EmailTemplateRelations
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(EmailTemplate, dataSource);
  }
}
