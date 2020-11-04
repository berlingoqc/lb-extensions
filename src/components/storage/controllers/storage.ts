import {Constructor, inject, MixinTarget, service} from '@loopback/core';
import {
  del,
  get,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestApplication,
  RestBindings,
} from '@loopback/rest';
import {
  chain,
  ClassMixinDecoratorOptions,
  getDecoratorsProperties,
} from '../../../helpers';
import {ContainerMetadata} from '../providers';
import {StorageService} from '../services';

// add a storageController to your application
export const addStorageControler = (
  app: RestApplication,
  config?: ClassMixinDecoratorOptions,
) => {
  class Test extends StorageControllerMixin<Constructor<object>>(
    Object,
    config,
  ) {
    constructor(@service(StorageService) storageService: StorageService) {
      super();
      this.storageService = storageService;
    }
  }

  app.controller(Test);
};

// StorageControllerMixin to add storage container
export function StorageControllerMixin<T extends MixinTarget<object>>(
  superClass: T,
  mixinClassDecorator?: ClassMixinDecoratorOptions,
) {
  class StorageController extends superClass {
    storageService: StorageService;

    @get('/containers')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    async getContainer() {
      return this.storageService.getContainer();
    }

    @get('/containers/{name}')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    async getContainerByName(@param.path.string('name') name: string) {
      return this.storageService.getContainer(name);
    }

    @post('/containers')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    createContainer(@requestBody() body: ContainerMetadata) {
      return this.storageService.createContainers(body);
    }

    @del('/containers/{name}')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    deleteContainer(@param.path.string('name') name: string) {
      return this.storageService.destroyContainer(name);
    }

    @get('/containers/{name}/files')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    getFilesContainer(@param.path.string('name') name: string) {
      return this.storageService.getFile(name);
    }

    @get('/containers/{name}/files/{file}')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    async getFileContainer(
      @param.path.string('name') name: string,
      @param.path.string('file') file: string,
    ) {
      return this.storageService.getFile(name, file);
    }

    @del('/containers/{name}/files/{file}')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    removeFile(
      @param.path.string('name') name: string,
      @param.path.string('file') file: string,
    ) {
      return this.storageService.removeFile(name, file);
    }

    @post('/containers/{name}/upload')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    uploadFiles(
      @param.path.string('name') name: string,
      @inject(RestBindings.Http.REQUEST)
      request: Request,
      @inject(RestBindings.Http.RESPONSE)
      response: Response,
    ) {
      return this.storageService.upload(name, request, response);
    }

    @get('/containers/{name}/download/{file}')
    @chain(...getDecoratorsProperties(mixinClassDecorator?.properties))
    async download(
      @param.path.string('name') name: string,
      @param.path.string('file') file: string,
      @inject(RestBindings.Http.RESPONSE)
      response: Response,
      @inject(RestBindings.Http.REQUEST)
      request: Request,
    ) {
      await this.storageService.download(name, file, request, response);
      return response;
    }
  }

  return StorageController;
}
