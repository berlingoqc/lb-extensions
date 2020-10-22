import {Entity, property, model} from '@loopback/repository';

export type RevisionAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'hardDelete'
  | 'replace';

@model()
export class Revision extends Entity {
  @property({
    id: true,
    generated: true,
  })
  id: number;

  @property()
  action: RevisionAction;

  @property()
  table: string;

  @property()
  rowId: string;

  @property()
  old: object;

  @property()
  new: object;

  @property()
  by: string;

  @property()
  ip: string;

  @property()
  createdAt: Date;

  constructor(data: Partial<Revision>) {
    super(data);
  }
}
