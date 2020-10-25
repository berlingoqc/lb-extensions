import {Component} from '@loopback/core';
import {StorageService} from './services';

export class StorageComponent implements Component {
  constructor() {}

  services = [StorageService];
}
