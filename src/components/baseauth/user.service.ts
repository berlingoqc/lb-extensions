import {UserService} from '@loopback/authentication';
import {model, property, repository} from '@loopback/repository';
import {HttpErrors, SchemaObject} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {User} from './model';
import {UserRepository} from './repository';
import {PasswordHasher, PasswordHasherBindings} from '../password';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

/**
 * A pre-defined type for user credentials. It assumes a user logs in
 * using the email and password. You can modify it if your app has different credential fields
 */
export type Credentials = {
  username: string;
  password: string;
};

@model()
export class ChangePasswordRequest {
  @property()
  newPassword: string;
  @property()
  oldPassword: string;
}

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class ProfileCredentialService
  implements UserService<User, Credentials>
{
  static invalidCredentialsError = 'Invalid email or password.';

  constructor(
    @repository(UserRepository)
    private profileRepo: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    private passwordHasher: PasswordHasher,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const foundUser = await this.profileRepo.findOne({
      where: {username: credentials.username},
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(
        ProfileCredentialService.invalidCredentialsError,
      );
    }

    const passwordMatched = await this.passwordHasher.comparePassword(
      credentials.password,
      foundUser.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(
        ProfileCredentialService.invalidCredentialsError,
      );
    }

    return foundUser;
  }

  async createPasswordHashed(user: User) {
    return this.passwordHasher.hashPassword(user.password);
  }

  async changePassword(
    user: User,
    request: ChangePasswordRequest,
  ): Promise<void> {
    await this.verifyCredentials({
      username: user.username,
      password: request.oldPassword,
    });
    const newPasswordHashed = await this.passwordHasher.hashPassword(
      request.newPassword,
    );
    return this.profileRepo.updateById(user.id, {password: newPasswordHashed});
  }

  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user.id.toString(),
      name: user.username,
      email: '',
    };
  }
}
