import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
import {chain, ClassMixinDecoratorInfo, getPropertie} from '../../../helpers';
import {ContainerMetadata} from '../providers';
import {StorageService} from '../services';

// add a storageController to your application
export const addStorageControler = (
  app: RestApplication,
  config?: ClassMixinDecoratorInfo,
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
  mixinClassDecorator?: ClassMixinDecoratorInfo,
) {
  class StorageController extends superClass {
    storageService: StorageService;

    @get('/containers')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    async getContainer() {
      return this.storageService.getContainer();
    }

    @get('/containers/{name}')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    async getContainerByName(@param.path.string('name') name: string) {
      return this.storageService.getContainer(name);
    }

    @post('/containers')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    createContainer(@requestBody() body: ContainerMetadata) {
      return this.storageService.createContainers(body);
    }

    @del('/containers/{name}')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    deleteContainer(@param.path.string('name') name: string) {
      return this.storageService.destroyContainer(name);
    }

    @get('/containers/{name}/files')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    getFilesContainer(@param.path.string('name') name: string) {
      return this.storageService.getFile(name);
    }

    @get('/containers/{name}/files/{file}')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    async getFileContainer(
      @param.path.string('name') name: string,
      @param.path.string('file') file: string,
    ) {
      return this.storageService.getFile(name, file);
    }

    @del('/containers/{name}/files/{file}')
    @chain(...getPropertie(mixinClassDecorator?.properties))
    removeFile(
      @param.path.string('name') name: string,
      @param.path.string('file') file: string,
    ) {
      return this.storageService.removeFile(name, file);
    }

    @post('/containers/{name}/upload')
    @chain(...getPropertie(mixinClassDecorator?.properties))
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
    @chain(...getPropertie(mixinClassDecorator?.properties))
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
