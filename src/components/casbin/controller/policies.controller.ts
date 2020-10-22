import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Constructor, inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {CasbinPolicyRepository} from '../repositories';
import {RolesService} from '../services/roles.service';
import {CasbinPolicy} from '../models';
import {AuditzControllerMixin} from '../../auditz/mixins/auditz.controller';
import {voterInjectRessourceId} from '../helpers';

export class PoliciesController extends AuditzControllerMixin<
  CasbinPolicy,
  number,
  Constructor<object>
>(Object, {
  basePath: '/policies',
  ressource: 'policy',
  modelClass: CasbinPolicy,
}) {
  constructor(
    @repository(CasbinPolicyRepository)
    private casbinPolicyRepository: CasbinPolicyRepository,
    @service(RolesService)
    private roleService: RolesService,
  ) {
    super();
    this.repository = this.casbinPolicyRepository;
  }

  // CUSTOM

  @get('/policies/js')
  @authenticate('jwt')
  async getJsPolicy(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<{perm: string}> {
    return this.roleService.getJSPermissionForUser(+userProfile.id);
  }

  // GENERATED
  @post('/policies', {
    responses: {
      '200': {
        description: 'CasbinPolicy model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(CasbinPolicy)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['create'],
    allowedRoles: ['policymanager'],
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CasbinPolicy, {
            title: 'NewCasbinPolicy',
            exclude: ['id'],
          }),
        },
      },
    })
    casbinPolicy: Omit<CasbinPolicy, 'id'>,
  ): Promise<CasbinPolicy> {
    return this.casbinPolicyRepository.create(casbinPolicy);
  }

  @get('/policies/count', {
    responses: {
      '200': {
        description: 'CasbinPolicy model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['find'],
    allowedRoles: ['policymanager'],
  })
  async count(
    @param.where(CasbinPolicy) where?: Where<CasbinPolicy>,
  ): Promise<Count> {
    return this.casbinPolicyRepository.count(where);
  }

  @get('/policies', {
    responses: {
      '200': {
        description: 'Array of CasbinPolicy model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(CasbinPolicy, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['find'],
    allowedRoles: ['policymanager'],
  })
  async find(
    @param.filter(CasbinPolicy) filter?: Filter<CasbinPolicy>,
  ): Promise<CasbinPolicy[]> {
    return this.casbinPolicyRepository.find(filter);
  }

  @patch('/policies', {
    responses: {
      '200': {
        description: 'CasbinPolicy PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['updateAll'],
    allowedRoles: ['policymanager'],
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CasbinPolicy, {partial: true}),
        },
      },
    })
    casbinPolicy: CasbinPolicy,
    @param.where(CasbinPolicy) where?: Where<CasbinPolicy>,
  ): Promise<Count> {
    return this.casbinPolicyRepository.updateAll(casbinPolicy, where);
  }

  @get('/policies/{id}', {
    responses: {
      '200': {
        description: 'CasbinPolicy model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(CasbinPolicy, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['findById'],
    allowedRoles: ['policymanager'],
    voters: [voterInjectRessourceId(0)],
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CasbinPolicy, {exclude: 'where'})
    filter?: FilterExcludingWhere<CasbinPolicy>,
  ): Promise<CasbinPolicy> {
    return this.casbinPolicyRepository.findById(id, filter);
  }

  @patch('/policies/{id}', {
    responses: {
      '204': {
        description: 'CasbinPolicy PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['updateById'],
    allowedRoles: ['policymanager'],
    voters: [voterInjectRessourceId(0)],
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CasbinPolicy, {partial: true}),
        },
      },
    })
    casbinPolicy: CasbinPolicy,
  ): Promise<void> {
    await this.casbinPolicyRepository.updateById(id, casbinPolicy);
  }

  @put('/policies/{id}', {
    responses: {
      '204': {
        description: 'CasbinPolicy PUT success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['replaceById'],
    allowedRoles: ['policymanager'],
    voters: [voterInjectRessourceId(0)],
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() casbinPolicy: CasbinPolicy,
  ): Promise<void> {
    await this.casbinPolicyRepository.replaceById(id, casbinPolicy);
  }

  @del('/policies/{id}', {
    responses: {
      '204': {
        description: 'CasbinPolicy DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    resource: 'policy',
    scopes: ['deleteById'],
    allowedRoles: ['policymanager'],
    voters: [voterInjectRessourceId(0)],
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.casbinPolicyRepository.deleteById(id);
  }
}
