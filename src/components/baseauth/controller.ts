import {TokenService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {model, property} from '@loopback/repository';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {TokenServiceBindings} from '../../key';
import {
  Credentials,
  CredentialsRequestBody,
  ProfileCredentialService,
} from './user.service';

@model()
export class LoginResponse {
  @property()
  id: string;
  @property()
  ttl: number;
  @property()
  created: string;
  @property()
  userId: number;
}

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    private jwtService: TokenService,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private ttl: string,
    @inject('userservice')
    private userService: ProfileCredentialService,
  ) {}

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: getModelSchemaRef(LoginResponse),
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<LoginResponse> {
    const user = await this.userService.verifyCredentials(credentials);

    const userProfile = this.userService.convertToUserProfile(user);

    const token = await this.jwtService.generateToken(userProfile);

    // Retourne la même structure que dans loopback3
    return {
      id: token,
      ttl: +this.ttl,
      created: new Date().toISOString(),
      userId: +user.id,
    };
  }
}
