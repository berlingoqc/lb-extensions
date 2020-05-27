import { AuthenticationStrategy } from '@loopback/authentication';
import { service } from '@loopback/core';
import { Request } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import { SSORequestService } from '../services';



export class JWTRemoteStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @service(SSORequestService) public ssoRequestService: SSORequestService
  ) { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    return this.ssoRequestService.requestAuthRequest(request);
  }
}
