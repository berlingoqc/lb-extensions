import {Component, Binding} from '@loopback/core';
import {TokenServiceBindings} from '../../key';
import {JWTService} from './jwt.service';
import {UserRepository} from './repository';
import {UserController} from './controller';
import {ProfileCredentialService} from './user.service';

export class BaseAuthComponent implements Component {
  repositories = [UserRepository];
  controllers = [UserController];
  bindings = [
    Binding.bind('userservice').toClass(ProfileCredentialService),
    Binding.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService),
    Binding.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET ?? Date.now().toString(),
    ),
    Binding.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      process.env.JWT_TTL ?? '9600',
    ),
  ];
}
