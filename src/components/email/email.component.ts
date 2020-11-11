import {Binding, Component, createServiceBinding} from '@loopback/core';
import {EmailTemplateRepository} from './repositories';
import {EmailSenderService} from './services';

export class EmailTemplateComponent implements Component {
  bindings = [
    Binding.bind('repositories.EmailTemplateRepository').toClass(
      EmailTemplateRepository,
    ),
  ];
}

export class EmailComponent implements Component {
  bindings = [createServiceBinding(EmailSenderService)];
}
