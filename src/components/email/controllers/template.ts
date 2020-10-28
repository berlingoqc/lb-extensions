import {Constructor} from '@loopback/core';
import {CrudControllerMixin, CrudControllerMixinOptions} from '../../crud';
import {EmailTemplate} from '../models';
import {repository} from '@loopback/repository';
import {EmailTemplateRepository} from '../repositories';
import {RestApplication} from '@loopback/rest';

const defaultConfig = {
  name: 'email-template',
  properties: [],
  id: 'key',
};

/**
 * Ajout un EmailTemplateController à votre application
 *
 * @param app RestApplication
 * @param options , par default name: email-template
 */
export const addEmailTemplateController = (
  app: RestApplication,
  options?: CrudControllerMixinOptions,
) => {
  const config = options
    ? Object.assign(options, defaultConfig)
    : defaultConfig;
  class EmailTemplateController extends CrudControllerMixin<
    Constructor<object>,
    EmailTemplate,
    typeof EmailTemplate.prototype.key
  >(Object, EmailTemplate, config) {
    constructor(
      @repository(EmailTemplateRepository)
      emailTemplateRepository: EmailTemplateRepository,
    ) {
      super();
      this.repository = emailTemplateRepository;
    }
  }

  return app.controller(EmailTemplateController).key;
};
