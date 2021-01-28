import {expect, supertest} from '@loopback/testlab';
import {
  addStorageController,
  FileMetadata,
  FileStorageService,
  StorageBindings,
  StorageComponent,
  StorageService,
} from '../../components/storage';
import * as fs from 'fs';
import {setupApplication, TestApplication} from '../fixtures/app';
import {join} from 'path';

describe('Storage component', () => {
  let app: TestApplication;
  let client: supertest.SuperTest<supertest.Test>;

  before('settup Application', async function () {
    ({app, client} = await setupApplication(
      {
        strategy: 'local',
        pkg: {},
        dirname: __dirname,
      },
      async (testapp: TestApplication) => {
        testapp.component(StorageComponent);
        addStorageController(testapp, {properties: []});
      },
    ));
  });

  after(async () => {
    if (app) {
      await app.stop();
    }
  });

  describe('Testing File Storage with StorageService', () => {
    let service: StorageService;
    let path: string;
    const fileName = 'storage.spec.js';
    before(async () => {
      path = fs.mkdtempSync('test');

      app.bind(StorageBindings.STORAGE_PROVIDER).toClass(FileStorageService);
      app.bind(StorageBindings.STORAGE_OPTIONS).to({
        destination: path,
      } as any);

      service = await app.get(StorageBindings.SERVICE);
    });

    after(() => {
      fs.rmdirSync(path, {recursive: true});
    });

    it('Create a new container', async () => {
      const metadata = await service.createContainers({name: 'c1'});

      expect(metadata).not.undefined();
    });

    it('Upload file into it', async () => {
      const files = (
        await client
          .post(`/containers/c1/upload`)
          .attach('files', join(__dirname, fileName))
          .expect(200)
      ).body as FileMetadata[];
      expect(files).to.be.Array();
      expect(files[0].name).to.eql(fileName);
    });

    it('Get file uploaded', async () => {
      const data = (await service.getFile('c1', fileName)) as FileMetadata;
      expect(data.name).equal(fileName);

      const listFiles = (await service.getFile('c1')) as FileMetadata[];
      expect(listFiles.length).equal(1);
      expect(listFiles[0].name).equal(fileName);
    });

    it('Download file', async () => {
      await client.get('/containers/c1/download/' + fileName).expect(200);
    });

    it('Delete file', async () => {
      await service.removeFile('c1', fileName);

      await expect(service.getFile('c1', fileName)).to.be.rejected();
    });
    it('delete container', async () => {
      await expect(service.deleteContainer('c1')).to.be.fulfilled();
    });
  });
});
