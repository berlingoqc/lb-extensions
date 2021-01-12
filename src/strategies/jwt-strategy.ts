import {inject} from '@loopback/context';
import {HttpErrors, Request} from '@loopback/rest';
import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {UserProfile} from '@loopback/security';
import {TokenServiceBindings} from '../key';

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
    @inject(TokenServiceBindings.TOKEN_QUERY_PARAM_NAME)
    public paramName: string,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    const userProfile: UserProfile = await this.tokenService.verifyToken(token);
    return userProfile;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractCredentials(request: any): string {
    // regarde si on n'a le token en query params
    let token;
    if (this.paramName) {
      token = request.query[this.paramName];
      if (token) {
        return token;
      }
    }
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // for example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (authHeaderValue.startsWith('Bearer')) {
      //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
      const parts = authHeaderValue.split(' ');
      if (parts.length !== 2)
        throw new HttpErrors.Unauthorized(
          `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
        );
      return parts[1];
    }
    return authHeaderValue;
  }
}
