import {bind, /* inject, */ BindingScope, inject} from '@loopback/core';
import {Request, HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';

import * as rp from 'request-promise-native';
import {SSOAuthBindings} from '../key';

@bind({scope: BindingScope.TRANSIENT})
export class SSORequestService {
  constructor(
    @inject(SSOAuthBindings.SSO_URL)
    private readonly apiAuthURL: string,
  ) {}

  async requestGet<T>(
    request: Request,
    path: string,
    params: {[id: string]: unknown} = {},
  ): Promise<T> {
    const token = this.extractCredentials(request);
    const resp = await rp.get(this.apiAuthURL + path, {
      headers: {
        authorization: 'Bearer ' + token,
      },
    });
    return JSON.parse(resp);
  }

  async requestAuthRequest(request: Request): Promise<UserProfile | undefined> {
    return this.requestGet<UserProfile>(request, '/api/users/me');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractCredentials(request: any): string {
    let token = request.query.token;
    if (token) {
      return token;
    }
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );
    }

    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    token = parts[1];

    return token;
  }
}
