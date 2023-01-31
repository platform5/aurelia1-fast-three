// aurelia-validation tips
// https://stackoverflow.com/a/49354106/437725
import 'aurelia-polyfills';
import { ValidationRules } from 'aurelia-validation';
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger = getLogger('decorators:type-decorator');

export class TypeDecorator {

  name: string;
  defaultOptions: any = {};

  fromApi: (key: string, value: any, options: any, element: any, target: any) => Promise<any>;
  toApi: (key: string, value: any, options: any, element: any, target: any) => Promise<any>;

  input: (key: string, value: any, options: any, element: any, target: any) => Promise<any>;
  output: (key: string, value: any, options: any, element: any, target: any) => Promise<any>;
  validate: (value: any, obj: any, options: any) => boolean | Promise<boolean>;

  private customValidationRuleReady = false;

  constructor(name: string) {
    this.name = name;
    this.fromApi = (key: string, value: any, options: any, element: any, target: any) => {
      return Promise.resolve(value);
    };
    this.toApi = (key: string, value: any, options: any, element: any, target: any) => {
      return Promise.resolve(value);
    };
    this.input = (key: string, value: any, options: any, element: any, target: any) => {
      return Promise.resolve(value);
    };
    this.output = (key: string, value: any, options: any, element: any, target: any) => {
      return Promise.resolve(value);
    };
    this.validate = (value: any, obj: any, options: any) => {
      return true;
    }
  }

  decorator() {
    if (!this.customValidationRuleReady) {
      this.createCustomValidationRule();
      this.customValidationRuleReady = true;
    }

    return (optionsOrTarget?: any, key?: string, descriptor?: PropertyDescriptor): any => {
      let options = {};
      if (key) {
        // used without parameters
        options = Object.assign(options, this.defaultOptions);
      } else {
        options = Object.assign(options, this.defaultOptions, optionsOrTarget);
      }

      let deco = (target: any, key: string, descriptor?: PropertyDescriptor): void | any => {
        if (descriptor) descriptor.writable = true;
        if (!target._types) target._types = {};
        if (!target._typesOptions) target._typesOptions = {};
        target._types[key] = this;
        target._typesOptions[key] = this.optionsHook(options, target, key);
        if (descriptor) return descriptor;
      };

      if (key) {
        return deco(optionsOrTarget, key, descriptor);
      } else {
        return deco;
      }
    }
  }

  public optionsHook(options: any, target: any, key: any) {
    return options;
  }

  private createCustomValidationRule() {
    ValidationRules.customRule(
      `type:${this.name}`,
      this.validate,
      `The \${$propertyName} property is not valid (${this.name}).`
    );
  }

}
