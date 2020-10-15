import * as casbin from 'casbin';
import {expect} from '@loopback/testlab';
import {join} from 'path';
import {
  CasbinBindings,
  CasbinPolicyRepository,
  EnforcerByRoleOrFilter,
} from '../../components';
import {setupApplication, TestApplication} from '../fixtures/app';
import {FIXTURES_POLICIES} from '../fixtures/data/policy';
import {TestDataSource} from '../fixtures/datasource';
import {LBCasbinAdapter} from '../../components/casbin/adapter';

describe('Test repository des profiles', () => {
  let app: TestApplication;

  before('setupApplication', async function () {
    ({app} = await setupApplication(
      {
        strategy: 'local',
        pkg: {},
        casbin: true,
        dirname: __dirname,
      },
      async (testapp: TestApplication) => {
        testapp.bind('datasources.postregsql').toClass(TestDataSource);
        testapp
          .bind(CasbinBindings.MODEL_PATH)
          .to(
            join(__dirname, '../../../src/__tests__/fixtures/rbac_model.conf'),
          );
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

  it('Valid that policy is allow', async () => {
    const repo = await app.getRepository(CasbinPolicyRepository);
    await repo.createAll(FIXTURES_POLICIES);

    const enforcer = await casbin.newEnforcer(
      await app.get(CasbinBindings.MODEL_PATH),
      new LBCasbinAdapter(repo),
    );

    const allow = await enforcer.enforce('u273', 'policy', 'count');

    expect(allow).true();
  });
});
