import {setupApplication, TestApplication} from '../fixtures/app';
import {
  model,
  property,
  DefaultCrudRepository,
  Entity,
  juggler,
} from '@loopback/repository';
import {inject} from '@loopback/core';
import {TestDataSource} from '../fixtures/datasource';
import {expect, supertest} from '@loopback/testlab';
import {addCRUDController} from '../../components';

@model()
export class CustomModel extends Entity {
  @property({id: true, generated: true})
  id: string;

  @property({
    required: true,
  })
  autre: string;

  @property()
  optionel?: string;
}

export class CustomModelRepository extends DefaultCrudRepository<
  CustomModel,
  typeof CustomModel.prototype.id,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(CustomModel, dataSource);
  }
}

@model()
export class NumberModel extends Entity {
  @property({id: true, name: 'identifiant', generated: false})
  identifiant: number;
}

export class NumberModelRepository extends DefaultCrudRepository<
  NumberModel,
  typeof NumberModel.prototype.identifiant,
  {}
> {
  constructor(
    @inject('datasources.postregsql') dataSource: juggler.DataSource,
  ) {
    super(NumberModel, dataSource);
  }
}

describe('Test du CRUD Controller Mixin', () => {
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
        testapp.repository(NumberModelRepository);
      },
    ));
  });

  after(async () => {
    await app.stop();
  });

  describe('Test du constructeur', () => {
    it('Avec repository invalide', async () => {
      const bindingKey = addCRUDController(app, CustomModel, 'Ccaa', {
        name: '',
        properties: [],
      });

      await expect(app.get(bindingKey)).to.be.rejected();
    });
    it('Avec repository valide', async () => {
      const bindingKey = addCRUDController(
        app,
        CustomModel,
        CustomModelRepository,
        {
          name: '',
          properties: [],
        },
      );

      await expect(app.get(bindingKey)).to.be.fulfilled();
    });

    it('Avec basepath spécifique', async () => {});

    describe("Utilisation d'un id custom", () => {
      before(() => {
        addCRUDController(app, NumberModel, NumberModelRepository, {
          name: 'number',
          properties: [],
          id: 'identifiant',
          idType: 'number',
          omitId: false,
        });
      });
      it('Si contient charactère alpha-numeric rejecté', async () => {
        await client.post('/number').send({identifiant: '123a'}).expect(422);
        await client.post('/number').send({identifiant: '123'}).expect(422);
      });

      it('Si seulement des nombres accepté', async () => {
        await client.post('/number').send({identifiant: 123}).expect(200);
      });

      it("Si le id n'est pas présent rejecté", async () => {
        await client.post('/number').send({id: 123}).expect(422);
      });

      it('FindById throw une exeception si pas number', async () => {
        await client.post('/number').send({identifiant: 123}).expect(200);

        await client.get('/number/1a').expect(400);
        await client.get('/number/1').expect(400);
      });
    });
  });

  describe('Test des request CRUD', () => {
    let repo: CustomModelRepository;
    before('configure controller', async () => {
      repo = await app.getRepository(CustomModelRepository);
      addCRUDController(app, CustomModel, repo, {
        name: 'custom',
        properties: [],
      });
    });

    beforeEach(async () => {
      await repo.deleteAll();
    });

    describe('Create', () => {
      it("Respectant le schéma de l'object 200", async () => {
        await client.post('/custom').send({autre: 'DSA'}).expect(200);
      });

      it("Propriété qui n'est pas dans le schéma erreur 422", async () => {
        await client
          .post('/custom')
          .send({autred: 'DSA', autre: 'DSA'})
          .expect(422);
      });
      it('Propriété required manquante retourne erreur 422', async () => {
        await client.post('/custom').send({}).expect(422);
      });
    });

    describe('Update', () => {
      it("Respectant le schéma et modification d'une entité existante", async () => {
        const item = await repo.create({autre: 'dsa'});
        await client
          .patch('/custom/' + item.id)
          .send({autre: 'dsa'})
          .expect(204);
      });

      it('Ne respectant pas le schéma', async () => {
        const item = await repo.create({autre: 'dsa'});
        await client
          .patch('/custom/' + item.id)
          .send({autred: 'dsa'})
          .expect(422);
      });

      it('Item non existant', async () => {
        await client.patch('/custom/1a').send({autred: 'dsa'}).expect(422);
      });
    });

    describe('Delete', () => {
      it('Delete existant', async () => {
        const item = await repo.create({autre: 'dsa'});

        await client.del('/custom/' + item.id).expect(204);
      });

      it("Delete entité qui n'existe pas ", async () => {
        await client.del('/custom/1a').expect(404);
      });
    });

    describe('Find', () => {
      it('find sans filtre', async () => {
        await client.get('/custom').expect(200);
      });

      it('Count', async () => {
        await repo.createAll([{autre: '1'}, {autre: '2'}]);

        const req = await client.get('/custom/count').expect(200);

        expect(req.body).to.eql({count: 2});
      });
    });
  });
});
