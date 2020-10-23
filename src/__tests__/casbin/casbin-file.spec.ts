import {expect, supertest} from '@loopback/testlab';
import {join} from 'path';
import {
  AuditzComponent,
  CasbinBindings,
  EnforcerByRoleOrFilter,
} from '../../components';
import {setupApplication, TestApplication} from '../fixtures/app';
import {TestJWTService} from '../fixtures/jwt.service';
import {TokenServiceBindings} from '../../key';
import {TestDataSource} from '../fixtures/datasource';
import {EnforcerFactoryProvider} from '../../components/casbin/providers';

describe('Test repository des profiles', () => {
  let app: TestApplication;
  let client: supertest.SuperTest<supertest.Test>;

  before('setupApplication', async function () {
    ({app, client} = await setupApplication(
      {
        strategy: 'local',
        pkg: {},
        casbin: true,
        dirname: __dirname,
      },
      async (testapp: TestApplication) => {
        testapp.bind('datasources.postregsql').toClass(TestDataSource);
        testapp
          .bind(TokenServiceBindings.TOKEN_SERVICE)
          .toClass(TestJWTService);
        testapp.component(AuditzComponent);
        testapp
          .bind(CasbinBindings.MODEL_PATH)
          .to(
            join(__dirname, '../../../src/__tests__/fixtures/rbac_model.conf'),
          );
        testapp.bind(CasbinBindings.POLICIES_PATH).to({
          policymanager: join(
            __dirname,
            '../../../src/__tests__/fixtures/policy.csv',
          ),
        });
        testapp
          .bind(CasbinBindings.FACTORY)
          .toProvider(EnforcerFactoryProvider);
      },
    ));
  });

  after(async () => {
    await app.stop();
  });

  it('Get enforcer factory', async () => {
    const enforcerFactory = (await app.get(
      CasbinBindings.FACTORY,
    )) as EnforcerByRoleOrFilter;

    expect(enforcerFactory).not.undefined();

    const enforcer = await enforcerFactory('policymanager');
    expect(enforcer).not.undefined();
  });

  it('Usager qui a accès', async () => {
    await client.get('/policies').set('Authorization', 'Bearer 1').expect(200);
  });
  it("Usager qui n'a pas l'accès", async () => {
    await client.get('/policies').set('Authorization', 'Bearer 0').expect(403);
  });
  it('Usager membre du sous-group qui a accés', async () => {
    await client.get('/policies').set('Authorization', 'Bearer 2').expect(200);
  });
});
