import {BindingKey} from '@loopback/core';

export namespace EmailBindings {
  export const TRANSPORTER = BindingKey.create<any>('email.transport');
  export const EMAIL_FROM = BindingKey.create<string>('email.from');
  export const DEV_EMAIL_TO = BindingKey.create<string>('email.to');
}
