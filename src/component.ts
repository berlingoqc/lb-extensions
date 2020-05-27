import { Component, ProviderMap, createServiceBinding } from '@loopback/core';
import { SSORequestService } from './services';

export class AlbLoopbackAuthComponent implements Component {
  constructor() { }

  bindings = [
    createServiceBinding(SSORequestService)
  ]

  providers?: ProviderMap = {
  };

}
