/* eslint-disable @typescript-eslint/no-explicit-any */
import * as mailer from 'nodemailer';
import {inject, bind, BindingScope} from '@loopback/core';
import {model, property} from '@loopback/repository';
import {EmailTemplateRepository} from '../repositories';

import * as dot from 'dot';
import {EmailBindings} from '../keys';
import {IEmailTemplate} from '../models';

// Model pour preview un email render
@model()
export class RenderEmail {
  @property()
  title?: string;
  @property()
  body: string;
}

// Type pour les données qui peuvent être injecter dans la template
export type TemplateData = {[id: string]: string | number | boolean};

/**
 * EmailSenderService , service pour l'envoie de email depuis une template
 * existante ou depuis un template passé en arguments
 */
@bind({scope: BindingScope.TRANSIENT})
export class EmailSenderService {
  transporter: mailer.Transporter;

  constructor(
    @inject(EmailBindings.TRANSPORTER) transport: mailer.Transport,
    @inject(EmailBindings.EMAIL_FROM, {optional: true})
    private emailFrom: string,
    @inject(EmailBindings.DEV_EMAIL_TO, {optional: true})
    private emailToOveride: string,
    @inject('repositories.EmailTemplatRepository', {optional: true})
    public emailTemplateRepo: EmailTemplateRepository,
  ) {
    this.setupTransport(transport);
  }

  setupTransport(transport: mailer.Transport) {
    this.transporter = mailer.createTransport(transport);
  }

  /**
   * Envoie un email directement avec l'info de NodeMailer
   * @param option , nodemail options
   */
  async sendMail(option: mailer.SendMailOptions): Promise<any> {
    if (this.emailToOveride) {
      // console.log('DEV overriding email to ', this.emailToOveride);
      option.to = this.emailToOveride;
    }
    option.from = this.validateEmailFrom(option.from);
    return this.transporter.sendMail(option);
  }

  /**
   * Envoie un email depuis une template a renderer
   * @param to : personne a qui ont envoie le email
   * @param template : template a render ,
   * peux-être une clé pour EmailTemplateRepository ou un template directement
   * @param data? : Data pour render la template
   * @param titleData? : Data pour render le title template
   * @param from? : Personne qui envoie le email, peux être configurer
   * globalement avec EmailBindings.EMAIL_FROM
   * @parma options?: nodemailer options qui sont merge avec les options générer
   * avec les autre champs
   */
  async sendMailFromTemplate(
    to: string,
    template: string | IEmailTemplate,
    data?: any,
    titleData?: any,
    from?: string,
    options?: mailer.SendMailOptions,
  ): Promise<{template: RenderEmail; sendData: any}> {
    const renderTemplate = await this.renderTemplate(template, data, titleData);
    const sendOptions: mailer.SendMailOptions = {
      to,
      from: this.validateEmailFrom(from),
      subject: renderTemplate.title,
      html: renderTemplate.body,
    };
    const sendData = await this.sendMail(
      Object.assign(options ?? {}, sendOptions),
    );
    return {template: renderTemplate, sendData};
  }

  async renderTemplate(
    template: string | IEmailTemplate,
    data?: TemplateData,
    titleData?: TemplateData,
  ): Promise<RenderEmail> {
    if (typeof template === 'string') {
      if (this.emailTemplateRepo) {
        template = await this.emailTemplateRepo.findById(template);
      } else {
        throw new Error(
          'renderTemplate got key but emailTemplate was not found in the context',
        );
      }
    }
    const templateBody = dot.template(template.body)(data);
    let templateHeader;
    if (template.title) {
      templateHeader = dot.template(template.title)(titleData);
    }
    return {title: templateHeader, body: templateBody};
  }

  private validateEmailFrom(from?: string | any) {
    if (from) {
      return from;
    } else if (this.emailFrom) {
      return this.emailFrom;
    } else {
      throw new Error(
        'options.from or EmailBindings.EMAIL_FROM must be set to send an email',
      );
    }
  }
}
