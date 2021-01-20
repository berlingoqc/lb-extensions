import {bind, BindingScope, inject} from '@loopback/core';
import {Request, Response} from '@loopback/rest';
import {Stream} from 'stream';
import {StorageBindings} from '../keys';
import {GetFileName} from '../providers';
import {
  ContainerMetadata,
  FileMetadata,
  StorageProvider,
} from '../providers/storage-provider';

@bind({scope: BindingScope.TRANSIENT, tags: [StorageBindings.SERVICE]})
export class StorageService implements StorageProvider {
  constructor(
    @inject(StorageBindings.STORAGE_PROVIDER)
    private provider: StorageProvider,
    @inject(StorageBindings.NAME_PROVIDER, {optional: true})
    private nameProvider: GetFileName,
  ) {}

  createContainers<T extends ContainerMetadata = ContainerMetadata>(
    config: T,
  ): Promise<object> {
    return this.provider.createContainers(config);
  }

  destroyContainer(name: string): Promise<void> {
    return this.provider.destroyContainer(name);
  }

  download(
    container: string,
    file: string,
    request: Request,
    response: Response,
  ): Promise<void> {
    return this.provider.download(container, file, request, response);
  }
  downloadStream(container: string, file: string): Promise<Stream> {
    return this.provider.downloadStream(container, file);
  }

  upload(
    container: string,
    req: Request,
    res: Response,
    options?: object,
  ): Promise<FileMetadata[]> {
    return this.provider.upload(container, req, res, options);
  }
  uploadStream(
    container: string,
    file: string,
    options?: object,
  ): Promise<Stream> {
    return this.provider.uploadStream(container, file, options);
  }

  getContainer<T extends ContainerMetadata = ContainerMetadata>(
    name?: string,
  ): Promise<T> {
    return this.provider.getContainer(name as any);
  }

  getFile<T extends FileMetadata = FileMetadata>(
    container: string,
    file?: string,
  ): Promise<T | T[]> {
    return this.provider.getFile(container, file);
  }

  removeFile(container: string, file: string): Promise<void> {
    return this.provider.removeFile(container, file);
  }
}
