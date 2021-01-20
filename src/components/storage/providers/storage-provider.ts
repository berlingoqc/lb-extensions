import {Request, Response} from '@loopback/rest';
import {Stream} from 'stream';

// Config de base pour storage component
export interface StorageProviderConfig {
  name: string;
}

// Metadata de base pour container
export interface ContainerMetadata {
  name: string;
}

// Metadata de base pour fichier
export interface FileMetadata {
  name: string;
}

/**
 * Implémentation pour fournir la base nécessaire
 */
export interface StorageProvider {
  createContainers<T extends ContainerMetadata = ContainerMetadata>(
    config: T,
  ): Promise<object>;
  destroyContainer(name: string): Promise<void>;

  download(
    container: string,
    file: string,
    request: Request,
    response: Response,
  ): Promise<void>;
  downloadStream(container: string, file: string): Promise<Stream>;

  upload(
    container: string,
    req: Request,
    res: Response,
    options?: object,
  ): Promise<FileMetadata[]>;
  uploadStream(
    container: string,
    file: string,
    options?: object,
  ): Promise<Stream>;

  getContainer<T extends ContainerMetadata = ContainerMetadata>(
    name: string,
  ): Promise<T>;
  getContainer<T extends ContainerMetadata = ContainerMetadata>(): Promise<T[]>;

  getFile<T extends FileMetadata = FileMetadata>(
    container: string,
    file?: string,
    option?: object,
  ): Promise<T | T[]>;

  removeFile(container: string, file: string): Promise<void>;
}
