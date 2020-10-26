import {Constructor, MixinTarget} from '@loopback/core';

export function EmailTemplateControllerMixin<
  T extends MixinTarget<object> = Constructor<object>
>(superClass: T) {}
