import { inject } from '@loopback/context';
import { HttpErrors, Request } from '@loopback/rest';
import { AuthenticationStrategy, TokenService } from '@loopback/authentication';
import { UserProfile } from '@loopback/security';


import * as rp from 'request-promise-native';
import { AlbLoopbackAuthBindings } from '../key';

export class JWTRemoteStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(AlbLoopbackAuthBindings.SSO_URL)
    private readonly apiAuthURL: string
  ) { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    //const userProfile: UserProfile = await this.tokenService.verifyToken(token);
    return this.validToken(token);
  }


  async validToken(token: string): Promise<UserProfile | undefined> {
    const resp = await rp.get(this.apiAuthURL + '/api/users/me', {
      headers: {
        'authorization': 'Bearer ' + token
      }
    });
    return JSON.parse(resp);
  }

  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // for example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );
    }

    //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    const token = parts[1];

    return token;
  }
}
