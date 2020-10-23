import {ProviderMap, Component} from '@loopback/core';
import {SequenceActionProvider} from '../providers';
import {AlbLoopbackAuthBindings} from '../key';

export class SequenceActionComponent implements Component {
  constructor() {}

  providers?: ProviderMap = {
    [AlbLoopbackAuthBindings.SEQUENCE_PROVIDER.key]: SequenceActionProvider,
  };
}
