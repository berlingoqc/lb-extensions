import {BindingKey} from '@loopback/core';
import {ClassMixinDecoratorOptions} from '../../helpers';
import {GetFileName} from './providers';
import {
  StorageProvider,
  StorageProviderConfig,
} from './providers/storage-provider';
import {StorageService} from './services';

export namespace StorageBindings {
  export const SERVICE = BindingKey.create<StorageService>('storage.service');

  export const STORAGE_OPTIONS = BindingKey.create<StorageProviderConfig>(
    'storage.options',
  );
  export const STORAGE_PROVIDER = BindingKey.create<StorageProvider>(
    'storage.provider',
  );

  export const NAME_PROVIDER = BindingKey.create<GetFileName>('storage.name');

  export const REST_DECORATORS = BindingKey.create<ClassMixinDecoratorOptions>(
    'storage.decorator',
  );
}
