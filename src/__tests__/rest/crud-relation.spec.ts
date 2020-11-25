import {Getter, inject} from '@loopback/core';
import {
  model,
  Entity,
  property,
  DefaultCrudRepository,
  juggler,
  belongsTo,
  repository,
  hasOne,
  hasMany,
  BelongsToAccessor,
  HasOneRepositoryFactory,
  HasManyRepositoryFactory,
} from '@loopback/repository';
import {expect, supertest} from '@loopback/testlab';
import {addCRUDControllerWithRelations} from '../../components';
import {setupApplication, TestApplication} from '../fixtures/app';
import {TestDataSource} from '../fixtures/datasource';

@model()
export class ManyModel extends Entity {
  @property({id: true, generated: true})
  id: number;

  @belongsTo(() => CustomModel)
  customModelId: number;
}

@model()
export class OneModel extends Entity {
  @property({id: true, generated: true})
  id: number;

  @belongsTo(() => CustomModel)
  customModelId: number;
}

@model()
export class CustomModel extends Entity {
  @property({id: true, generated: true})
  id: string;

  @hasMany(() => ManyModel, {name: 'manies'})
  manies: ManyModel[];

  @hasOne(() => OneModel, {name: 'one'})
  one: OneModel;
}

export class CustomModelRepository extends DefaultCrudRepository<
  CustomModel,
  typeof CustomModel.prototype.id,
  {}
> {
  public readonly manies: HasManyRepositoryFactory<
    ManyModel,
    typeof ManyModel.prototype.id
  >;

  public readonly one: HasOneRepositoryFactory<
    OneModel,
    typeof ManyModel.prototype.id
  >;
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
    @repository.getter('ManyModelRepository')
    manyModelRepo: Getter<ManyModelRepository>,
    @repository.getter('OneModelRepository')
    oneModelRepo: Getter<OneModelRepository>,
  ) {
    super(CustomModel, dataSource);
    this.manies = this.createHasManyRepositoryFactoryFor(
      'manies',
      manyModelRepo,
    );
    this.registerInclusionResolver('manies', this.manies.inclusionResolver);
    this.one = this.createHasOneRepositoryFactoryFor('one', oneModelRepo);
    this.registerInclusionResolver('one', this.one.inclusionResolver);
  }
}
export class ManyModelRepository extends DefaultCrudRepository<
  ManyModel,
  typeof ManyModel.prototype.id,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(ManyModel, dataSource);
  }
}
export class OneModelRepository extends DefaultCrudRepository<
  OneModel,
  typeof OneModel.prototype.id,
  {}
> {
  public readonly customModel: BelongsToAccessor<
    CustomModel,
    typeof OneModel.prototype.id
  >;
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
    @repository.getter('CustomModelRepository')
    customModelRepo: Getter<CustomModelRepository>,
  ) {
    super(OneModel, dataSource);

    this.customModel = this.createBelongsToAccessorFor(
      'customModel',
      customModelRepo,
    );
  }
}

describe('Test CrudRelationController', () => {
  let app: TestApplication;
  let client: supertest.SuperTest<supertest.Test>;

  before('setupApp', async () => {
    ({app, client} = await setupApplication(
      {
        strategy: 'local',
        pkg: {},
        dirname: __dirname,
      },
      async (testapp: TestApplication) => {
        testapp.bind('datasources.postregsql').toClass(TestDataSource);
        testapp.repository(CustomModelRepository);
        testapp.repository(OneModelRepository);
        testapp.repository(ManyModelRepository);
      },
    ));
  });

  after(async () => {
    await app.stop();
  });

  describe('Test CRUD Relation par REST', () => {
    let customModelRepo: CustomModelRepository;
    let oneModelRepo: OneModelRepository;
    let manyModelRepo: ManyModelRepository;

    before(async () => {
      customModelRepo = await app.getRepository(CustomModelRepository);
      oneModelRepo = await app.getRepository(OneModelRepository);
      manyModelRepo = await app.getRepository(ManyModelRepository);

      addCRUDControllerWithRelations(
        app,
        CustomModel,
        customModelRepo,
        {
          name: 'customModel',
          properties: [],
        },
        [
          {
            modelRelationDef: OneModel,
            optionsRelation: {
              name: 'one',
            },
          },
          {
            modelRelationDef: ManyModel,
            optionsRelation: {
              name: 'manies',
            },
          },
        ],
      );
      addCRUDControllerWithRelations(
        app,
        OneModel,
        oneModelRepo,
        {name: 'one', properties: []},
        [
          {
            modelRelationDef: CustomModel,
            optionsRelation: {name: 'customModel'},
          },
        ],
      );
    });

    describe('Test relation Many et One avec CustomModel', () => {
      let existingCustomModel: CustomModel;

      before(async () => {
        existingCustomModel = await customModelRepo.create({});
      });

      it('Request find HasMany doit retourner une ARRAY', async () => {
        const data = await client
          .get(`/customModel/${existingCustomModel.getId()}/manies`)
          .expect(200);
        expect(data.body).is.Array();
      });

      it('Request find HasOne doit retourner un object', async () => {
        await client
          .post(`/customModel/${existingCustomModel.getId()}/one`)
          .send({})
          .expect(200);
      });
    });

    describe('Test relation BelongsTo avec CustomModel', () => {});
  });
});
