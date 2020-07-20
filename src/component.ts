import { Component, ProviderMap, createServiceBinding } from '@loopback/core';
import { SSORequestService } from './services';
import { AlbLoopbackAuthBindings } from './key';
import { SequenceActionProvider } from './providers/sequence';

export class AlbLoopbackAuthComponent implements Component {
  constructor() { }

  bindings = [
    createServiceBinding(SSORequestService)
  ];

  providers?: ProviderMap = {
    [AlbLoopbackAuthBindings.SEQUENCE_PROVIDER.key]: SequenceActionProvider
  };

}
