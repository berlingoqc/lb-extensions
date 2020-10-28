/* eslint-disable @typescript-eslint/no-invalid-this */
import {expect, supertest} from '@loopback/testlab';
import {addEmailTemplateController} from '../../components/email/controllers/template';
import {
  EmailComponent,
  EmailTemplateComponent,
} from '../../components/email/email.component';
import {EmailBindings} from '../../components/email/keys';
import {EmailTemplateRepository} from '../../components/email/repositories';
import {EmailSenderService} from '../../components/email/services';
import {setupApplication, TestApplication} from '../fixtures/app';
import {TestDataSource} from '../fixtures/datasource';

describe('Email Component', function () {
  this.timeout(20000);
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

        testapp.component(EmailComponent);

        testapp.bind(EmailBindings.TRANSPORTER).to({
          type: process.env.EMAIL_TYPE,
          host: process.env.EMAIL_HOST,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
          post: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      },
    ));
  });

  after(async () => {
    await app.stop();
  });

  describe('Test de email service', () => {
    let service: EmailSenderService;

    beforeEach(async () => {
      service = await app.get('services.EmailSenderService');
    });

    describe('Test construction', () => {
      it('Ne provided pas de EMAIL_FROM donc error si non spécifié', async () => {
        await expect(
          service.sendMailFromTemplate('info@alborea.com', 'template'),
        ).to.be.rejected();
      });
      it("Provier EMAIL_FROM donc pas besoin de spécifié de from lors d'envoie", async () => {
        app.bind(EmailBindings.EMAIL_FROM).to('portail@alphard.com');
        service = await app.get('services.EmailSenderService');
        await expect(
          service.sendMailFromTemplate('info@alborea.com', {body: 'Template'}),
        ).to.be.fulfilled();
      });
    });

    it("Envoie d'un email simple", async () => {
      const sendData = await service.sendMail({
        to: 'info@alborea.com',
        from: 'portail@alphard.com',
        text: 'Salut a toi',
        html: '<p>Salut a toi</p>',
      });

      expect(sendData.accepted).to.be.eql(['info@alborea.com']);
      expect(sendData.rejected).to.be.empty();
    });

    describe('Envoie depuis une avec template', () => {
      const bodyData = {data: 4};
      const titleData = {quoi: 'oui'};
      const template = {
        body: '<p>I like to dance {{=it.data}}</p>',
        title: 'Un titre {{=it.quoi}}',
      };
      const templateResolved = {
        title: 'Un titre oui',
        body: '<p>I like to dance 4</p>',
      };

      it('Render simplement une template', async () => {
        const renderEmailTemplate = await service.renderTemplate(
          template,
          bodyData,
          titleData,
        );
        expect(renderEmailTemplate).to.eql(templateResolved);
      });
      it('Envoie avec une template directement', async () => {
        const sendData = await service.sendMailFromTemplate(
          'info@alborea.com',
          template,
          bodyData,
          titleData,
          'portail@alphard.com',
        );

        expect(sendData.sendData.accepted).to.be.eql(['info@alborea.com']);
        expect(sendData.sendData.rejected).to.be.empty();
      });

      describe('Envoie avec EmailTemplateComponent', () => {
        before(() => {
          app.component(EmailTemplateComponent);
        });

        beforeEach(async () => {
          const repo = await app.getRepository(EmailTemplateRepository);
          await repo.create({
            key: 'TEST',
            body: template.body,
            title: template.title,
          });
          service.emailTemplateRepo = repo;
        });

        it('Render template dans la base de donnée', async () => {
          const renderTemplate = await service.renderTemplate(
            'TEST',
            bodyData,
            titleData,
          );

          expect(renderTemplate).to.be.eql(templateResolved);
        });

        it('Render template qui existe pas', async () => {
          await expect(service.renderTemplate('UNKNOW')).to.be.rejected();
        });

        it('Envoie un email depuis template de la base de donnée', async () => {
          const sendData = await service.sendMailFromTemplate(
            'info@alborea.com',
            'TEST',
            bodyData,
            titleData,
            'portail@alphard.com',
          );

          expect(sendData.template).to.be.eql(templateResolved);
          expect(sendData.sendData.accepted).to.be.eql(['info@alborea.com']);
          expect(sendData.sendData.rejected).to.be.empty();
        });
      });
    });
  });

  describe('Test de email-template controller mixin', () => {
    before(() => {
      app.component(EmailTemplateComponent);
    });
    it("Ajout d'un mixin anonymement", async () => {
      addEmailTemplateController(app);

      await client.get('/email-template').expect(200);
    });
  });
});
