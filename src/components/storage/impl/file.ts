import multer from 'multer';
import {Stream} from 'stream';
import {HttpErrors, Request, Response} from '@loopback/rest';
import {
  ContainerMetadata,
  FileMetadata,
  StorageProvider,
  StorageProviderConfig,
} from '../providers';
import {inject} from '@loopback/core';
import {StorageBindings} from '../keys';

import * as path from 'path';
import * as fs from 'fs';

export interface FileProviderConfig extends StorageProviderConfig {
  destination: string;
}

export interface FileContainerMetadata extends ContainerMetadata {}

export interface PFileMetdata extends FileMetadata {}

export class FileStorageService implements StorageProvider {
  constructor(
    @inject(StorageBindings.STORAGE_OPTIONS)
    private config: FileProviderConfig,
  ) {
    config.destination = path.resolve(config.destination);
  }

  private getMulterConfig(container: string): multer.Options {
    return {
      storage: multer.diskStorage({
        destination: path.join(this.config.destination, container),
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    };
  }

  private getContainerPath(container: string, file?: string) {
    return path.join(this.config.destination, container, file ?? '');
  }

  private validateFileName(container: string, fileName: string) {
    const folder = this.getContainerPath(container);
    const resolved = path.resolve(folder, fileName);
    if (resolved.startsWith(folder)) return resolved;
    throw new HttpErrors.BadRequest('Name outside of sandbox');
  }

  private static getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    });
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return {files, fields: request.body};
  }

  // Create folder with container name
  async createContainers<
    T extends StorageProviderConfig = StorageProviderConfig
  >(config: T): Promise<object> {
    // valid not present
    const containerPath = this.getContainerPath(config.name);
    fs.mkdirSync(containerPath);
    return config;
  }

  // Remove folder
  async destroyContainer(name: string): Promise<void> {
    const containerPath = this.getContainerPath(name);
    fs.rmdirSync(containerPath, {recursive: true});
  }

  async download(
    container: string,
    fileName: string,
    request: Request,
    response: Response,
  ): Promise<void> {
    const file = this.validateFileName(container, fileName);
    response.download(file, fileName);
  }
  downloadStream(container: string, file: string): Promise<Stream> {
    throw new HttpErrors.NotImplemented('');
  }

  upload(
    container: string,
    req: Request,
    res: Response,
    options?: object,
  ): Promise<void> {
    return new Promise((resolv, reject) => {
      const mul = multer(this.getMulterConfig(container)).any();
      mul(req, res, (err: unknown) => {
        if (err) reject(err);
        resolv();
      });
    });
  }
  uploadStream(
    container: string,
    file: string,
    options?: object,
  ): Promise<Stream> {
    throw new HttpErrors.NotImplemented('');
  }

  getContainer<T extends ContainerMetadata = ContainerMetadata>(
    name?: string,
  ): Promise<T | T[]> {
    if (name) {
      const containerPath = this.getContainerPath(name);
      fs.readdirSync(containerPath);
      return {name} as any;
    } else {
      return fs
        .readdirSync(this.config.destination, {withFileTypes: true})
        .filter((dirent) => dirent.isDirectory()) as any;
    }
  }

  async getFile<T extends FileMetadata = FileMetadata>(
    container: string,
    file?: string,
  ): Promise<T | T[]> {
    if (file) {
      const pat = this.getContainerPath(container, file);
      const info = fs.statSync(pat) as any;
      info['name'] = file;
      return info as any;
    }
    return fs
      .readdirSync(this.getContainerPath(container), {withFileTypes: true})
      .filter((item) => item.isFile()) as any;
  }

  async removeFile(container: string, file: string): Promise<void> {
    fs.unlinkSync(this.getContainerPath(container, file));
  }
}
