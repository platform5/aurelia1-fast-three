import { SwissdataApi } from './../helpers/swissdata-api';
import { validate, jsonify } from '../deco';
import { Container } from 'aurelia-framework';

export const uniqueByApp = <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
  if (descriptor) descriptor.writable = true;
  validate.addTargetValidation(target, 'uniqueByApp', key);
  if (descriptor) return descriptor;
}

validate.ValidationRules.customRule(
  `validate:uniqueByApp`,
  (value: any, obj: any, options: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return true;
    if (value === '') return true;
    let swissDataApi: SwissdataApi = Container.instance.get(SwissdataApi);
    return swissDataApi.get('/user/exists/' + options.key + '/' + value).then(jsonify).then((result) => {
      if (result && typeof result.exists === 'boolean') {
        if (options && options.instance && options.instance.id && result.id === options.instance.id) return true;
        return !result.exists;
      }
      throw new Error('Invalid response'); 
    });
  },
  `This \${$propertyName} already exists`
);
