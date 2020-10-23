import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {AlbAuthMixin} from '../../mixins';
import {createRestAppClient} from '@loopback/testlab';

export class TestApplication extends BootMixin(
  RepositoryMixin(AlbAuthMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
  }
}

export async function setupApplication(
  option: ApplicationConfig,
  init: (t: TestApplication) => Promise<void>,
) {
  const app = new TestApplication(option);

  await init(app);
  await app.boot();
  await app.migrateSchema();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}
