import {bind, BindingScope, CoreBindings, Getter, inject} from '@loopback/core';
import {
  repository,
  ApplicationWithRepositories,
  DefaultCrudRepository,
  Entity,
} from '@loopback/repository';
import {UserProfile, SecurityBindings} from '@loopback/security';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {RevisionRepository} from '../repositories';
import {Revision, RevisionAction} from '../models';

@bind({scope: BindingScope.TRANSIENT})
export class RevisionService {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: ApplicationWithRepositories,
    @inject.getter(RestBindings.Http.REQUEST)
    private requestGetter: Getter<Request>,
    @inject.getter(SecurityBindings.USER)
    private userGetter: Getter<UserProfile>,
    @repository(RevisionRepository)
    private revisionRepository: RevisionRepository,
  ) {}

  async onCreate(table: string, newData: object, id: string): Promise<void> {
    await this.createRevision('create', table, id, newData);
  }

  async onReplace(table: string, newData: object, id: string): Promise<void> {
    await this.createRevision('replace', table, id, newData);
  }

  async onUpdate(table: string, newData: object, id: string): Promise<void> {
    await this.createRevision('update', table, id, newData);
  }

  async onRestore(table: string, id: string) {
    await this.createRevision('restore', table, id, {});
  }

  async onHardDelete(table: string, id: string) {
    await this.createRevision('hardDelete', table, id, {});
  }

  async onDelete(table: string, newData: object, id: string): Promise<void> {
    await this.createRevision('delete', table, id, newData);
  }

  private async createRevision(
    action: RevisionAction,
    table: string,
    id: string,
    newData: object,
  ): Promise<Revision> {
    const user = await this.userGetter();
    const request = await this.requestGetter();

    let old;
    if (action === 'update') {
      const repo = (await this.application.get(
        `repositories.${table}Repository`,
      )) as DefaultCrudRepository<Entity, string, {}>;
      if (!repo) {
        throw new HttpErrors.InternalServerError(
          'Cant found repository for table ' + table,
        );
      }
      old = await repo.findById(id);
    }
    const revision = new Revision({
      action,
      table,
      by: user.id,
      old,
      rowId: id,
      new: newData,
      ip:
        (request.headers['x-real-ip'] as string) ??
        request.connection.remoteAddress,
      createdAt: new Date(),
    });

    return this.revisionRepository.create(revision);
  }
}
