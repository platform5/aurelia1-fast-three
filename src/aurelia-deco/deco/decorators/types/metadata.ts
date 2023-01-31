import { TypeDecorator } from './type-decorator';
import { validateString, validateInteger, validateFloat, validateBoolean, validateDate } from './basics';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type:metadata');

export interface Metadata {
  key: string;
  value: any;
  type?: string;
}
// TODO: convert null to undefined somewhere ??
export let validateMetadata = (value: any, options: any) => {
  if (value === null) return true; // this is true only because before sending the data to api it will be converted to undefined (see .toApi);
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;

  let allowedKeys = ['key', 'value', 'type'];
  for (let data of value) {
    if (typeof data !== 'object') return false;
    let keys = Object.keys(data);
    for (let key of keys) {
      if (allowedKeys.indexOf(key) === -1) return false;
    }
    if (data.key === undefined) return false;
    if (data.value === undefined) return false;
  }

  return true;
}
export let metadataDecorator = new TypeDecorator('metadata');
metadataDecorator.validate = (value: any, obj: any, options: any) => {
  return validateMetadata(value, options);
};
metadataDecorator.toApi = (key: string, value: any, options: any, element: any, target: any) => {
  if (value === null) value = undefined;
  return Promise.resolve(value);
};
export const metadata = metadataDecorator.decorator();
