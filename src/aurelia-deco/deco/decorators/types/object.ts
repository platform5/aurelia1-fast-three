import { TypeDecorator } from './type-decorator';
import { validateString, validateInteger, validateFloat, validateBoolean, validateDate } from './basics';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type:object');

export let validateObject = (value: any, options: any) => {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'object') return false;
  if (options && options.keys) {
    let allowOtherKeys = (options.allowOtherKeys === true);

    // validate required fields
    for (let key of Object.keys(options.keys)) {
      let keySettings = options.keys[key];
      if (keySettings.required === true && !value[key]) return false;
    }

    for (let key of Object.keys(value)) {
      let keySettings = options.keys[key];
      if (!keySettings && !allowOtherKeys) return false;
      if (!keySettings) continue;
      if (keySettings.type === 'string' && !validateString(value[key])) return false;
      if (keySettings.type === 'integer' && !validateInteger(value[key])) return false;
      if (keySettings.type === 'float' && !validateFloat(value[key])) return false;
      if (keySettings.type === 'boolean' && !validateBoolean(value[key])) return false;
      if (keySettings.type === 'date' && !validateDate(value[key])) return false;
    }
  }
  return true;
}

export let toApiObject = (value: any, options: {allowOtherKeys?: boolean, keys: {[key: string]: any}}) => {
  let allowOtherKeys = (options.allowOtherKeys === true)
  if (!allowOtherKeys) {
    const newValue: {[key: string]: any} = {};
    for (const key of Object.keys(options.keys)) {
      newValue[key] = value[key];
    }
    value = newValue
  }
  return value;
};

export let objectDecorator = new TypeDecorator('object');
objectDecorator.toApi = (key: string, value: any, options: any, element: any, target: any) => {
  return Promise.resolve(toApiObject(value, options));
};
objectDecorator.validate = (value: any, obj: any, options: any) => {
  return validateObject(value, options);
};
export const object = objectDecorator.decorator();
