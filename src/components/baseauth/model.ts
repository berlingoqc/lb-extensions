import {Entity, model, property} from '@loopback/repository';

@model()
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
