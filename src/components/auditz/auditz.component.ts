import {
  Component,
  CoreBindings,
  createServiceBinding,
  inject,
} from '@loopback/core';
import {ApplicationWithRepositories} from '@loopback/repository';
import {RevisionRepository} from './repositories';
import {RevisionService} from './services';

export class AuditzComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: ApplicationWithRepositories,
  ) {
    application.repository(RevisionRepository);
  }

  bindings = [createServiceBinding(RevisionService)];
}
