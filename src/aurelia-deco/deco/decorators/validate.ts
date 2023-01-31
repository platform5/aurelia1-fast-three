import { ValidationRules } from 'aurelia-validation';
import { getLogger, Logger } from 'aurelia-logging';
let log:Logger = getLogger('decorators:validate');

export { ValidationRules };

export interface PropertyValidation {
  type: string,
  options: any;
}

export function addTargetValidation(target: any, type: string, key: string | number | symbol, options = {}) {

  if (!target._validations) target._validations = {};
  if (!target._validations[key]) target._validations[key] = [];

  let validation: PropertyValidation = {
    type: type,
    options: options
  };

  target._validations[key].push(validation);
}

export const required = <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
  if (descriptor) descriptor.writable = true;
  addTargetValidation(target, 'required', key);
  if (descriptor) return descriptor;
}

export const minLength = (minLength: number = 0) => {
  return <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
    if (descriptor) descriptor.writable = true;
    addTargetValidation(target, 'minLength', key, {minLength: minLength});
    if (descriptor) return descriptor;
  };
}

export const maxLength = (maxLength: number = 0) => {
  return <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
    if (descriptor) descriptor.writable = true;
    addTargetValidation(target, 'maxLength', key, {maxLength: maxLength});
    if (descriptor) return descriptor;
  };
}

export const email = <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
  if (descriptor) descriptor.writable = true;
  addTargetValidation(target, 'email', key);
  if (descriptor) return descriptor;
};

export const internationalPhoneNumber = (acceptedCountryList: Array<string> = []) => {
  return <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
    if (descriptor) descriptor.writable = true;
    addTargetValidation(target, 'internationalPhoneNumber', key, {acceptedCountryList: acceptedCountryList});
    if (descriptor) return descriptor;
  };
}

export const slug = <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
  if (descriptor) descriptor.writable = true;
  addTargetValidation(target, 'slug', key);
  if (descriptor) return descriptor;
};




ValidationRules.customRule(
  `validate:internationalPhoneNumber`,
  (value: any, obj: any, options: any) => {
    let validatedPhoneNumber = validatePhoneNumber(value);
    if (validatedPhoneNumber === false) return false;
    return true;
  },
  `\${$propertyName} is not a valid phone number.`
);

let validatePhoneNumber = (phoneNumber):boolean | string => {
  if (typeof phoneNumber !== 'string') return false;
  if (phoneNumber[0] !== '+') return false;

  phoneNumber = phoneNumber.substr(1); // remove the original +

  // remove all non-numeric chars
  phoneNumber = phoneNumber.replace(/([^0-9]*)/g, "");

  if (phoneNumber.substr(0, 2) === '41') {
    // swiss phone number
    let part1 = phoneNumber.substr(0, 2);
    let part2 = phoneNumber.substr(2);

    if (part2[0] === '0') {
      part2 = part2.substr(1); // remove the first 0 if present
    }
    if (part2.length === 9) {
      return `+${part1}${part2}`;
    }
  }
  return false;
}
