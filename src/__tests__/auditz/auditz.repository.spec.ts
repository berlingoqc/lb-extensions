/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor, Getter, inject, service} from '@loopback/core';
import {
  model,
  property,
  DefaultCrudRepository,
  Entity,
  juggler,
} from '@loopback/repository';
import {RestBindings} from '@loopback/rest';
import {UserProfile, SecurityBindings} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {
  AuditzComponent,
  AuditzModelMixin,
  AuditzRepository,
  AuditzRepositoryMixin,
  AuditzRepositorySettings,
  RevisionService,
} from '../../components';
import {setupApplication, TestApplication} from '../fixtures/app';
import {TestDataSource} from '../fixtures/datasource';

class BaseEntity extends Entity {}
@model()
export class CustomModel extends AuditzModelMixin(BaseEntity) {
  @property({
    id: true,
    generated: true,
  })
  id: number;
  @property()
  autre: string;
}

describe('Repository avec AuditzMixin sans revision', () => {
  let app: TestApplication;
  let repo: AuditzRepository<CustomModel, number>;
  before('setupApp', async () => {
    ({app} = await setupApplication(
      {
        strategy: 'local',
        pkg: {},
        casbin: true,
        dirname: __dirname,
      },
      async (testapp: TestApplication) => {
        testapp.component(AuditzComponent);
        testapp.bind('datasources.postregsql').toClass(TestDataSource);
      },
    ));
  });

  after(async () => {
    await app.stop();
  });

  // AJOUTER CASE pour le constructeur du repository
  describe("Construction d'un Repository avec le mixin", () => {
    it('Activer revision sans spécifié le nom de la table doit être rejeté', async () => {
      await expect(setRepo({revision: true})).to.be.rejectedWith(Error);
    });

    it('Activer revision avec le nom de la table', async () => {
      await expect(
        setRepo({revision: true, table: 'CustomModel'}),
      ).to.not.be.rejected();
    });

    it("Par default ne doit pas retourné les informations d'auditz", async () => {
      repo = await setContext({
        id: '123',
        data: [{autre: 'dsa'}],
      });

      const findData = await repo.find();

      expect(findData[0].createdBy).undefined();
      expect(findData[0].createdAt).undefined();
      expect(findData[0].updatedAt).undefined();
      expect(findData[0].updatedBy).undefined();
      expect(findData[0].deletedAt).undefined();
      expect(findData[0].deletedBy).undefined();
    });

    it("Active le retour par default des informations d'auditz", async () => {
      repo = await setContext({
        id: '123',
        config: {hideAuditzData: false},
        data: [{autre: 'dsa'}],
      });

      const findData = await repo.find();

      expect(findData[0].createdBy).Number();
      expect(findData[0].createdAt).Date();
    });

    it('Par default le softDelete devrait être utilisé', async () => {
      repo = await setContext({
        id: '123',
        config: {softDeleted: true}, // config par default
        data: [{autre: 'dsa'}],
      });

      await expect(repo.deleteById(1)).to.fulfilled();
    });

    it('Désactive le hardDelete , item devrait être supprimé de facon permanante', async () => {});
  });

  it('Ne peux pas accéder a une ressource avec Audit si non connecter', async () => {
    repo = await setRepo();
    const promiseCreate = repo.create({});
    await expect(promiseCreate).to.be.rejected();
  });

  describe('Opération find avec AuditzMixin', () => {
    it("Ne doit pas retourner d'élément supprimer", async () => {
      repo = await setContext({
        id: '123',
        config: {softDeleted: true},
        data: [{autre: 'dsa'}],
      });

      await repo.delete(new CustomModel({id: 1} as any));
      const findData = await repo.find();

      expect(findData).length(0);
    });
  });

  describe('Opération create avec AuditzMixin', () => {
    it('Create doit contenir date et id de création ', async () => {
      repo = await setContext({id: '123'});
      const data = await repo.create({autre: 'firstdata'});
      expect(data);

      expect(data.createdAt).to.Date();
      expect(data.createdBy).to.equal(123);
    });
  });

  describe('Update', () => {
    it('Apres modification doit contenir updatedBy et updatedAt', async () => {
      repo = await setContext({
        id: '123',
        config: {hideAuditzData: false},
        data: [{autre: 'dsa'}],
      });

      const itemBeforeUpdate = await repo.findById(1);

      expect(itemBeforeUpdate.updatedAt).to.be.undefined();
      expect(itemBeforeUpdate.updatedBy).to.be.undefined();

      await repo.updateById(1, {autre: '123'});

      const item = await repo.findById(1);

      expect(item.updatedAt).to.Date();
      expect(item.createdBy).to.equal(123);
    });
  });

  describe('HardDelete', () => {
    it('Supprime un élément et ne doit plus exister', async () => {
      repo = await setContext({
        id: '123',
        config: {softDeleted: false},
        data: [{autre: 'dsa'}],
      });
      await repo.delete(new CustomModel({id: 1} as any));
      const items = await repo.findSoftDeleted();

      expect(items).length(0);
    });
  });

  describe('SoftDelete', () => {
    beforeEach(async () => {
      repo = await setContext({
        id: '123',
        config: {softDeleted: true},
        data: [{autre: 'dsa'}],
      });
      await repo.delete(new CustomModel({id: 1} as any));
    });

    it('Accède a un element SoftDelete', async () => {
      const items = await repo.findSoftDeleted();

      expect(items).length(1);
    });

    it('Restorer un élément', async () => {
      expect(await repo.restoreByIdSoftDeleted(1)).not.throwError();
      const items = await repo.find();

      expect(items).length(1);
    });

    it('Supprime de facon permanente', async () => {
      expect(await repo.hardDeleteById(1)).not.throwError();
      const items = await repo.findSoftDeleted();

      expect(items).length(0);
    });
  });

  async function setContext(config: {
    id: string;
    ip?: string;
    remoteAddr?: string;
    config?: AuditzRepositorySettings;
    data?: Partial<CustomModel>[];
  }) {
    app.bind(SecurityBindings.USER).to({id: config.id} as any);
    app.bind(RestBindings.Http.REQUEST).to({
      connection: {
        remoteAddress: config.ip,
      },
      headers: {
        'x-real-ip': config.remoteAddr,
      },
    } as any);
    repo = await setRepo(config.config);
    if (config.data) {
      await repo.createAll(config.data);
    }
    return repo;
  }

  async function setRepo(config: AuditzRepositorySettings = {}) {
    class CustomModelRepository extends AuditzRepositoryMixin<
      CustomModel,
      typeof CustomModel.prototype.id,
      Constructor<
        DefaultCrudRepository<CustomModel, typeof CustomModel.prototype.id, {}>
      >
    >(DefaultCrudRepository, config) {
      constructor(
        @inject('datasources.postregsql') dataSource: juggler.DataSource,
        @inject.getter(SecurityBindings.USER)
        userGetter: Getter<UserProfile>,
        @service(RevisionService)
        revisionService: RevisionService,
      ) {
        super(CustomModel, dataSource);
        this.userGetter = userGetter;
        this.revisionService = revisionService;
      }
    }
    app.repository(CustomModelRepository);
    return (await app.get(
      'repositories.CustomModelRepository',
    )) as AuditzRepository<CustomModel, number>;
  }
});
