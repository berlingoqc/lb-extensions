import {Entity, property} from '@loopback/repository';

export class User extends Entity {
  @property({
    id: true,
    generated: true,
  })
  id: number;

  @property()
  username: string;

  @property()
  password: string;
}
