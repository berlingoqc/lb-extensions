import { bind, /* inject, */ BindingScope, inject } from '@loopback/core';
import { AlbLoopbackAuthBindings } from '../key';

@bind({ scope: BindingScope.TRANSIENT })
export class SsoRequestService {
  constructor(
    @inject(AlbLoopbackAuthBindings.SSO_URL)
    private readonly apiAuthURL: string
  ) { }

  request(token: string) {

  }
  /*
   * Add service methods here
   */
}
