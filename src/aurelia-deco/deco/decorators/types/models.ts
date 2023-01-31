import { TypeDecorator } from './type-decorator';
import { Model } from '../model';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type:models');

export let modelDecorator = new TypeDecorator('model');
modelDecorator.defaultOptions = {
  model: 'not-set'
}
modelDecorator.optionsHook = (options: any, target: any, key: string) => {
  if (options && options.model === 'self') options.model = target.constructor;
  return options;
}
modelDecorator.validate = (value: any, obj: any, options: any) => {
  if (options.model === 'not-set') return Promise.reject(new Error('Model not set'));
  if (options.model !instanceof Model) return Promise.reject(new Error('options.model must be a Model instance'));

  if (value === undefined || value === null) return true;

  if (value.match(/^[a-fA-F0-9]{24}$/)) return true;
  return false;
};

export const model = modelDecorator.decorator();

export let modelsDecorator = new TypeDecorator('models');
modelsDecorator.defaultOptions = {
  model: 'not-set'
}
modelsDecorator.optionsHook = (options: any, target: any, key: string) => {
  if (options && options.model === 'self') options.model = target.constructor;
  return options;
}
modelsDecorator.validate = (value: any, obj: any, options: any) => {
  if (options.model === 'not-set') return Promise.reject(new Error('Model not set'));
  if (options.model ! instanceof Model) return Promise.reject(new Error('options.model must be a Model instance'));

  if (value === null) return false;
  if (value === undefined || Array.isArray(value)) return true;
  if (!Array.isArray(value)) return false;
  for (let v of value) {
    if (!v.match(/^[a-fA-F0-9]{24}$/)) return false;
  }
  return true;
};

export const models = modelsDecorator.decorator();
