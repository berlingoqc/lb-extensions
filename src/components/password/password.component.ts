import {Binding, Component} from '@loopback/core';
import {PasswordHasherBindings} from './keys';
import {BcryptHasher} from './hash.password.bcryptjs';

export class PasswordComponent implements Component {
  constructor() {}

  bindings = [
    Binding.bind(PasswordHasherBindings.ROUNDS).to(10),
    Binding.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher),
  ];
}
