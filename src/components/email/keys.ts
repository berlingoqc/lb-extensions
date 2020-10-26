import {BindingKey} from '@loopback/core';

export namespace EmailBindings {
  export const TRANSPORTER = BindingKey.create<Transport>('email.transport');
  export const EMAIL_FROM = BindingKey.create<string>('email.from');
}
