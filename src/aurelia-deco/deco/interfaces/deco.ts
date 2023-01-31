import { TypeDecorator } from '../decorators/types/type-decorator';
import { ModelOptions } from '../decorators/model';
import { PropertyForm } from './../decorators/form';
import { PropertyValidation } from './../decorators/validate';

export interface Deco {
  baseroute: string;
  target: any;

  options: ModelOptions;

  propertyTypes: {[key: string]: TypeDecorator};
  propertyTypesOptions: {[key: string]: any};
  propertyFromApiOnly: Array<string>;
  
  propertyForms: {[key: string]: Array<PropertyForm>};
  propertyValidations: {[key: string]: Array<PropertyValidation>};

  propertySearchables: Array<string>;
  propertySortables: Array<string>;
  propertyFilterables: Array<string>;
  propertyFilterablesOptions: {[key: string]: any};
}

export function cloneDeco(originalDeco: Deco): Deco {
  let newDeco = {
    baseroute: originalDeco.baseroute,
    target: originalDeco.target,
    options: originalDeco.options,
    propertyTypes: originalDeco.propertyTypes,
    propertyTypesOptions: originalDeco.propertyTypesOptions,
    propertyFromApiOnly: originalDeco.propertyFromApiOnly,
    propertyForms: originalDeco.propertyForms,
    propertyValidations: originalDeco.propertyValidations,
    propertySearchables: originalDeco.propertySearchables,
    propertySortables: originalDeco.propertySortables,
    propertyFilterables: originalDeco.propertyFilterables,
    propertyFilterablesOptions: originalDeco.propertyFilterablesOptions
  };
  return newDeco;
}