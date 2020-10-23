import {ApplicationConfig} from '@loopback/core';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}

export interface AlbAuthConfig extends ApplicationConfig {
  pkg?: PackageInfo;
  strategy?: 'local' | 'remote';
}
