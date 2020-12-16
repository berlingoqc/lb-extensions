/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {Filter, EntityCrudRepository, Entity} from '@loopback/repository';
import {CasbinBindings} from './keys';

/**
 * Assemble le nom de la ressource pour pour comparer avec enforcer loopback
 */
export function getResourceName(
  resource: string,
  id?: string | number,
): string {
  if (id) return `${resource}${id}`;
  return `${resource};`;
}

/**
 * Retourne le nom du suject avec l'identifiant d'une profile
 */
export function getSubjectFromId(id: number | string) {
  return `u${id}`;
}

/**
 * Voter qui injecte l'identifiant de la ressource qui veut être accéder 'project/{id}'
 * denied si ne trouve pas l'identificant voulue
 * @param indexArg: index du paramètre qui correspond a l'identifiant du path
 */
export function voterInjectRessourceId(
  indexArg: number,
): (
  ctx: AuthorizationContext,
  metadata: AuthorizationMetadata,
) => Promise<AuthorizationDecision> {
  return async (ctx, metada) => {
    const id = ctx.invocationContext.args[indexArg];
    if (!id) {
      return AuthorizationDecision.DENY;
    }
    const resourceId = getResourceName(metada.resource ?? ctx.resource, id);
    ctx.invocationContext.bind(CasbinBindings.RESOURCE_ID).to(resourceId);
    return AuthorizationDecision.ABSTAIN;
  };
}

/**
 * Voter inject l'identificant de l'owner depuis une table de la base de donnée
 * pour valider si la ressource appartient au profile qui a fait la requête
 * deny si exeception
 *
 * @param idIndex index de l'identifiant dans les paramètres
 * @param repoName nom du repertoire (eg: ProfileRepository)
 * @param ownerProperty nom de la propriété qui contient l'id de l'owner
 * @param keepOriginal si true bind l'object original a CasbinBingings.FULL_OBJECT
 * @param filter filtre additionel si vous planifier utilisé les données par la suite
 */
export function voterInjectObject(
  idIndex: number,
  repoName: string,
  ownerProperty: string,
  keepOriginal = true,
  filter: Pick<
    Filter<any>,
    'fields' | 'include' | 'limit' | 'offset' | 'order' | 'skip'
  > = {},
) {
  let repo: EntityCrudRepository<Entity, null, object>;
  return async (ctx: AuthorizationContext, md: AuthorizationMetadata) => {
    // get le id de la request
    if (!repo) {
      repo = await ctx.invocationContext.get(`repositories.${repoName}`);
    }
    try {
      const item: any = await repo.findById(
        ctx.invocationContext.args[idIndex],
        filter,
      );
      ctx.invocationContext.bind(CasbinBindings.ABAC_OBJECT).to({
        Owner: getSubjectFromId(item[ownerProperty]),
      });
      if (keepOriginal) {
        ctx.invocationContext.bind(CasbinBindings.FULL_OBJECT).to(item);
      }
    } catch (ex) {
      console.warn(ex);
      return AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.ABSTAIN;
  };
}
