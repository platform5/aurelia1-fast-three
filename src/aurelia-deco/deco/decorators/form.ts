import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:form');

export interface PropertyForm {
  type: string,
  options: any;
}

export function addTargetFormDecoration(target: any, type: string, key: string | number | symbol, options = {}) {

  if (!target._forms) target._forms = {};
  if (!target._forms[key]) target._forms[key] = [];

  let form: PropertyForm = {
    type: type,
    options: options
  };

  target._forms[key].push(form);
}

export const hint = (hintText: string = '') => {
  return <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
    if (descriptor) descriptor.writable = true;
    addTargetFormDecoration(target, 'hint', key, {text: hintText});
    if (descriptor) return descriptor;
  };
}

export const label = (labelText: string = '') => {
  return <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
    if (descriptor) descriptor.writable = true;
    addTargetFormDecoration(target, 'label', key, {text: labelText});
    if (descriptor) return descriptor;
  };
}
