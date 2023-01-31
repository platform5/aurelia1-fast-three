import { TypeDecorator } from './type-decorator';
import moment from 'moment';
import { getLogger, Logger } from 'aurelia-logging';
import { DateHelper } from 'aurelia-resources';
let log: Logger = getLogger('decorators:type:basics');

export let anyDecorator = new TypeDecorator('any');
export const any = anyDecorator.decorator();

export let idDecorator = new TypeDecorator('id');
export const id = idDecorator.decorator();

export let validateString = (value: any, options?: any) => {
  if (value === null || value === undefined) return true;
  // if value is string we accept its value for multilang or not
  if (typeof value === 'string') return true;
  // if not multilang (and not string) then it's wrong !
  if (!options.multilang) return false;
  // here we validate multilang strings with object values
  if (typeof value !== 'object') return false;
  for (let key in value) {
    if (options.locales.indexOf(key) === -1) return false;
  }
  return true;
};
export let stringDecorator = new TypeDecorator('string');
stringDecorator.defaultOptions = {
  multilang: false,
  locales: []
};
stringDecorator.validate = (value: any, obj: any, options: any) => {
  return validateString(value, options);
};
export const string = stringDecorator.decorator();

export let selectDecorator = new TypeDecorator('select');
selectDecorator.defaultOptions = {
  options: []
};
selectDecorator.validate = (value: any, obj: any, options: any) => {
  if (value === undefined || value === null) return true;
  if (!options.multiple) {
    // validate non-multiple values
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return false;
    if (options.allowAny) return true;
    if (options.options.indexOf(value) === -1) return false;
  } else if (options.multiple) {
    // validate multiple values
    if (!Array.isArray(value)) return false;
    for (let v of value) {
      if (typeof v !== 'string') return false;
      if (!options.allowAny && options.options.indexOf(v) === -1) return false;
    }
  }
  return true;
};
export const select = selectDecorator.decorator();

export let validateInteger = (value: any) => {return value === null || value === undefined || (typeof value === 'number' && Math.round(value) === value)};
export let integerDecorator = new TypeDecorator('integer');
integerDecorator.validate = (value: any, obj: any, options: any) => {
  return validateInteger(value);
};
export const integer = integerDecorator.decorator();

export let validateBoolean = (value: any) => {return value === null || value === undefined || typeof value === 'boolean'};
export let booleanDecorator = new TypeDecorator('boolean');
booleanDecorator.validate = (value: any, obj: any, options: any) => {
  return validateBoolean(value);
};
export const boolean = booleanDecorator.decorator();

export let fromApiDate = (value: any, dateFormat = 'DD-MM-YYYY') => {
  if (typeof value === 'string') {
    const m = DateHelper.moment(value, dateFormat);
    if (m && m.isValid()) {
      value = m.toDate();
    }
  }
  return value;
};
export let toApiDate = (value: any, dateFormat = 'DD-MM-YYYY') => {
  if (value instanceof Date) {
    value = moment(value).format(dateFormat);
  }
  return value;
};
export let validateDate = (value: any) => {return value === null || value === undefined || value instanceof Date};
export let dateDecorator = new TypeDecorator('date');
dateDecorator.defaultOptions = {
  dateFormat: 'DD-MM-YYYY'
};
dateDecorator.fromApi = (key: string, value: any, options: any, element: any, target: any) => {
  let dateFormat = options.dateFormat || 'DD-MM-YYYY';
  return Promise.resolve(fromApiDate(value, dateFormat));
};
dateDecorator.toApi = (key: string, value: any, options: any, element: any, target: any) => {
  let dateFormat = options.dateFormat || 'DD-MM-YYYY';
  return Promise.resolve(toApiDate(value, dateFormat));
};
dateDecorator.validate = (value: any, obj: any, options: any) => {
  return validateDate(value);
};
export const date = dateDecorator.decorator();

export let validateFloat = (value: any) => {return value === null || value === undefined || (typeof value === 'number')};
export let floatDecorator = new TypeDecorator('float');
floatDecorator.validate = (value: any, obj: any, options: any) => {
  return validateFloat(value);
};
export const float = floatDecorator.decorator();
