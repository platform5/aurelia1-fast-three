import { TypeDecorator } from '../deco';
import { getLogger } from 'aurelia-logging';
const log = getLogger('decorators:address');

export let inputAddress = (value: any) => {
  if (value === null || value === undefined) {
    value = undefined;
  }
  return value;
};
export let validateAddress = (value: any, options?: any) => {
  if (value === undefined) return true;
  if (typeof value !== 'object') return false;
  let allowedKeys = ['label', 'street', 'city', 'zip', 'country', 'description', 'lat', 'lng'];
  let stringKeys = ['label', 'street', 'city', 'zip', 'country', 'description'];
  let numberKeys = ['lat', 'lng'];
  for (let key in value) {
    if (allowedKeys.indexOf(key) === -1) return false;
    if (stringKeys.includes(key) && typeof value[key] !== 'string') return false;
    if (numberKeys.includes(key) && typeof value[key] !== 'number') return false;
  }
  return true;
};
export let addressDecorator = new TypeDecorator('address');
addressDecorator.validate = (value: any, obj: any, options: any) => {
  return validateAddress(value, options);
};
export const address = addressDecorator.decorator();

export let inputAddressArray = (value: any) => {
  if (value === null || value === undefined) {
    value = [];
  }
  return value;
};

export let validateAddressArray = (value: any, options?: any) => {
  if (!Array.isArray(value)) return false;
  for (let index in value) {
    let v = value[index];
    if (!validateAddress(v)) return false;
  }
  return true;
};

export let addressArrayDecorator = new TypeDecorator('addressArray');
addressArrayDecorator.input = (key: string, value: any, options: any, element: any, target: any) => {
  return Promise.resolve(inputAddressArray(value));
};
addressArrayDecorator.output = (key: string, value: any, options: any, element: any, target: any) => {
  return Promise.resolve(value);
};
addressArrayDecorator.validate = (value: any, obj: any, options: any) => {
  return validateAddressArray(value, options);
};
export const addressArray = addressArrayDecorator.decorator();

export interface Address {
  label?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export function isSameAddress(a: Address, b: Address): boolean {
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  let same = (a.label === b.label && a.street === b.street && a.zip === b.zip && a.city === b.city && a.country === b.country && a.description === b.description);
  return same;
}