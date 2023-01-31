import { model, Model, type, Deco, cloneDeco } from '../deco';
import { DynamicConfigModel } from './dynamicconfig.model';

/*
export let dynamicModelDecorator = new TypeDecorator('dynamicmodel');
dynamicModelDecorator.fromApi = type.modelDecorator.fromApi;
dynamicModelDecorator.toApi = type.modelDecorator.toApi;
dynamicModelDecorator.validate = type.modelDecorator.validate; // in the API, the dynamic model decorator has a different validate method but for now in the client it's the same
dynamicModelDecorator.decorator();

export let dynamicModelsDecorator = new TypeDecorator('dynamicmodels');
dynamicModelsDecorator.fromApi = type.modelsDecorator.fromApi;
dynamicModelsDecorator.toApi = type.modelsDecorator.toApi;
dynamicModelsDecorator.validate = type.modelsDecorator.validate; // in the API, the dynamic model decorator has a different validate method but for now in the client it's the same
dynamicModelsDecorator.decorator();
*/

export interface DynamicConfigModelWithDeco extends DynamicConfigModel {
  deco: Deco
}

@model('/dynamicdata')
export class DynamicDataModel extends Model {

  @type.id
  modelId: string;

  constructor(slug?: string) {
    super();
    if (slug) {
      Object.getPrototypeOf(this)._deco = DynamicDataModel.use(slug).deco;
      this.modelId = DynamicDataModel.models[slug].id;
    }
  }

  static models: {[key: string]: DynamicConfigModelWithDeco} = {};
  static currentModelSlug: string;

  static clearRegisteredModels() {
    DynamicDataModel.models = {};
    DynamicDataModel.currentModelSlug = '';
  }

  static registerModel(model: DynamicConfigModel) {
    DynamicDataModel.models[model.slug] = DynamicDataModel.addDecoToModel(model);
    DynamicDataModel.models[model.id] = DynamicDataModel.models[model.slug];
  }

  static addDecoToModel(model: DynamicConfigModel): DynamicConfigModelWithDeco {
    let deco: Deco = {
      baseroute: DynamicDataModel.originalDeco.baseroute + '/' + model.slug,
      target: DynamicDataModel.originalDeco.target,
      options: DynamicDataModel.originalDeco.options,
      propertyTypes: {},
      propertyTypesOptions: {},
      propertyFromApiOnly: [],
      propertyForms: {},
      propertyValidations: {},
      propertySearchables: [],
      propertySortables: [],
      propertyFilterables: [],
      propertyFilterablesOptions: {}
    };

    deco.propertyTypes.id = type.anyDecorator;

    for (let field of model.fields) {

      if (field.type === 'string' && field.options.multilang) {
        //field.options.locales = modelApp.locales;
      }
      let typeDecoratorKey: string = `${field.type}Decorator`;
      deco.propertyTypes[field.name] = (type as any)[typeDecoratorKey] || type.anyDecorator;
      deco.propertyTypesOptions[field.name] = field.options;
      deco.propertyValidations[field.name] = (Array.isArray(field.validation)) ? field.validation : [];

      if (field.required) {
        deco.propertyValidations[field.name].push({type: 'required', options: {}});
      }
    }

    let newModelConfig: DynamicConfigModelWithDeco = Object.assign({}, model, {deco: deco});
    return newModelConfig;
  }

  static use(slug: string): typeof DynamicDataModel {
    DynamicDataModel.currentModelSlug = slug;
    return DynamicDataModel;
  }

  static get deco(): Deco {
    return DynamicDataModel.models[DynamicDataModel.currentModelSlug].deco;
  }

  get deco(): Deco {
    let modelId = this.modelId;
    let dynamicDataModel: DynamicConfigModelWithDeco = DynamicDataModel.models[modelId];
    return dynamicDataModel.deco;
  }

  private static _originalDeco: Deco;
  static get originalDeco(): Deco {

    if (DynamicDataModel._originalDeco) return DynamicDataModel._originalDeco;
    if ((this.prototype as any)._deco) {
      DynamicDataModel._originalDeco = cloneDeco((this.prototype as any)._deco);
    }
    return DynamicDataModel._originalDeco;
  }

  static instanceFromElement<T extends typeof Model>(this: T, element): InstanceType<T> {
    let modelId = element.modelId;
    let dynamicDataModel: DynamicConfigModelWithDeco = DynamicDataModel.models[modelId];
    let instance = new dynamicDataModel.deco.target;
    instance.modelId = modelId;
    Object.getPrototypeOf(instance)._deco = dynamicDataModel.deco;
    return instance;
  }

  get _label() {
    let modelId = this.modelId;
    let model = this.deco.target.models[modelId];
    let labelConfig = model.label;

    if (!labelConfig) {
      return this.id;
    }

    let lits: Array<string> = [];
    let regex = /(?:.*?)\$\{([^$]*)\}(?:.*?)/g;

    let match: any;
    while (match = regex.exec(labelConfig)) {
      lits.push(match[1]);
    }

    let result = labelConfig;
    for (let lit of lits) {
      if (this[lit]) {
        result = result.replace('${' + lit + '}', this[lit]);
      } else {
        result = result.replace('${' + lit + '}', '[---]');
      }
    }

    return result;
  }

}
