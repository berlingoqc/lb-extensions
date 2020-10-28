import {TokenService} from '@loopback/authentication';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';

export class TestJWTService implements TokenService {
  constructor() {}

  async verifyToken(token: string): Promise<UserProfile> {
    let userProfile: UserProfile;

    try {
      userProfile = Object.assign(
        {[securityId]: '', name: ''},
        {
          [securityId]: token,
          id: token,
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    return '';
  }
}
