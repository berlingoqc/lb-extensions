import {Entity, model, property} from '@loopback/repository';
import {AuditzModelMixin} from '../../auditz/mixins/auditz.model';

class PolicyBase extends Entity {
  @property({
    id: true,
    generated: true,
  })
  id: number;

  @property()
  ptype: string;

  @property()
  v0: string;

  @property()
  v1: string;

  @property()
  v2: string;

  @property()
  v3: string;

  @property()
  v4: string;

  @property()
  v5: string;
}
/**
 * Basée sur https://github.com/node-casbin/typeorm-adapter/blob/master/src/casbinRule.ts
 */
@model()
export class CasbinPolicy extends AuditzModelMixin(PolicyBase) {}
