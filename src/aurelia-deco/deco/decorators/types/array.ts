import { TypeDecorator } from './type-decorator';
import { validateString, validateInteger, validateFloat, validateBoolean, validateDate } from './basics';
import { validateObject } from './object';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type:array');

export let arrayDecorator = new TypeDecorator('array');
arrayDecorator.validate = (value: any, obj: any, options: any) => {
  if (value === null || value === undefined) return true;
  if (!Array.isArray(value)) return false;

  if (options && options.type) {
    for (let item of value) {
      if (options.type === 'string' && !validateString(item)) return false;
      if (options.type === 'integer' && !validateInteger(item)) return false;
      if (options.type === 'float' && !validateFloat(item)) return false;
      if (options.type === 'boolean' && !validateBoolean(item)) return false;
      if (options.type === 'date' && !validateDate(item)) return false;
      if (options.type === 'object' && options.objectOptions && !validateObject(item, options.objectOptions)) return false;
    }
  }
  return true;
};
export const array = arrayDecorator.decorator();
