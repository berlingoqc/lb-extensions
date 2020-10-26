import {Entity, model, property} from '@loopback/repository';

// Contiens les champs pour la template
export interface IEmailTemplate {
  title: string; // DoT template for title
  template: string; // DoT template for body
}

@model()
export class EmailTemplate extends Entity implements IEmailTemplate {
  @property({
    id: true,
  })
  key: string;

  @property()
  title: string;

  @property()
  description: string; // Description of the template

  @property()
  template: string;

  @property()
  args?: {[id: string]: string}; // Args expected to received to correctly render the template

  constructor(data?: Partial<EmailTemplate>) {
    super(data);
  }
}

export interface EmailTemplateRelations {
  // describe navigational properties here
}

export type EmailTemplateWithRelations = EmailTemplate & EmailTemplateRelations;
