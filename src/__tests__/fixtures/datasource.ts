import {juggler} from '@loopback/repository';

export class TestDataSource extends juggler.DataSource {
  constructor() {
    super({
      name: 'postregsql',
      connector: 'memory',
    });
  }
}
