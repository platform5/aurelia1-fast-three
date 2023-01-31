import { TypeDecorator } from './type-decorator';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type:files');
export let fileDecorator = new TypeDecorator('file');
fileDecorator.defaultOptions = {
  accepted: ['image/*', 'application/pdf'],
  destination: 'uploads/'
}
fileDecorator.validate = (value: any, obj: any, options: any) => {
  if (value === undefined || value === null) return true;
  if (!value.name || !value.type || !value.size) return false;
  return true;
};
export const file = fileDecorator.decorator();

export let filesDecorator = new TypeDecorator('files');
filesDecorator.defaultOptions = {
  accepted: ['image/*', 'application/pdf'],
  destination: 'uploads-files/',
  maxCount: 12
}
filesDecorator.validate = (value: any, obj: any, options: any) => {
  if (value === null) value = [];
  if (value === undefined || Array.isArray(value)) return true;
  for (let file of value) {
    if (!file.name || !file.type || !file.size) return false;
  }
  return true;
};
export const files = filesDecorator.decorator();
