// import { UxFileItemArray } from './../components/form/ux-file-input';
import { UxFileItem } from '../helpers/file-upload';
import { Deco } from '../interfaces/deco';
import { Container } from 'aurelia-framework';
import { DecoApi, jsonify, RequestOption } from '../helpers/deco-api';
import { TypeDecorator } from './types/type-decorator';
import { ValidationRules, Validator, ValidationControllerFactory, ValidationController } from 'aurelia-validation';
// import { AureliaUXFormRenderer } from 'aurelia-resources';
import { getLogger, Logger } from 'aurelia-logging';
import moment from 'moment';
let log: Logger = getLogger('decorators:model');

//export type StaticThis<T> = { new (): T };

export interface ModelOptions {
  enableStory?: boolean;
}

export interface FilePreviewOptions {
  etag?: null | string;
  fileId: null | string;
  route?: string;
}

export interface GetAllOptions extends RequestOption {
  route?: string;
  getRefLocale?: boolean;
  includeResponse?: boolean;
}

export interface GetOneOptions extends RequestOption {
  route?: string;
  getRefLocale?: boolean;
  includeResponse?: boolean;
}

export interface SaveOptions extends RequestOption {
  route?: string;
  getRefLocale?: boolean;
  body?: any;
  bodyFormat?: 'json' | 'FormData';
  includeResponse?: boolean;
}

export interface FixBodyOptions extends RequestOption {
  bodyFormat?: 'json' | 'FormData';
}

export interface RemoveOptions extends RequestOption {
  route?: string;
}

export interface UpdatePropertiesOptions extends RequestOption {
  route?: string;
  bodyFormat?: 'json' | 'FormData';
  updateInstanceWithResponse?: boolean;
  includeResponse?: boolean;
}

let defaultModelOptions = {
  enableStory: false
};

export const model = (baseroute: string, options: ModelOptions = {}) => {
  options = Object.assign({}, defaultModelOptions, options);
  return function (target: any): void {

    let deco: Deco = {
      baseroute: baseroute,
      target: target,
      options: options,
      propertyTypes: target.prototype._types || {},
      propertyTypesOptions: target.prototype._typesOptions || {},
      propertyFromApiOnly: target.prototype._fromApiOnly || [],
      propertyForms: target.prototype._forms || {},
      //propertyOutputs: target.prototype._outputs || [],
      //propertyToDocuments: target.prototype._toDocuments || [],
      propertyValidations: target.prototype._validations || {},
      propertySearchables: target.prototype._searchables || [],
      propertySortables: target.prototype._sortables || [],
      propertyFilterables: target.prototype._filterables || [],
      propertyFilterablesOptions: target.prototype._filterablesOptions || {}
    };

    target.prototype._deco = deco;
  }
}

export class Model {

  id: string;
  _createdAt: Date;
  _createdBy: string;
  _updatedAt: Date;
  _updatedBy: string;

  _refLocales?: {[key: string]: {[key: string]: any}};

  static options: ModelOptions;

  static get deco(): Deco {
    return (this.prototype as any)._deco;
  }

  get deco(): Deco {
    return Object.getPrototypeOf(this)._deco;
  }

  static get api(): DecoApi {
    return Container.instance.get(DecoApi);
  }

  get api(): DecoApi {
    return Container.instance.get(DecoApi);
  }

  static get isMultilang(): boolean {
    for (let key in this.deco.propertyTypes) {
      if (this.deco.propertyTypes[key].name === 'string') {
        if (this.deco.propertyTypesOptions[key].multilang) return true;
      }
    }
    return false;
  }

  get isMultilang(): boolean {
    for (let key in this.deco.propertyTypes) {
      if (this.deco.propertyTypes[key].name === 'string') {
        if (this.deco.propertyTypesOptions[key].multilang) return true;
      }
    }
    return false;
  }

  static request(method: 'get' | 'post' | 'put' | 'delete', uri: string = '', body: any = {}, options: RequestOption = {} ): Promise<Array<Model>> {
    let promise: Promise<any>;
    if (method === 'get') {
      promise = this.api.get(uri, options);
    } else if (method === 'post') {
      promise = this.api.post(uri, body, options);
    } else if (method === 'put') {
      promise = this.api.put(uri, body, options);
    } else if (method === 'delete') {
      promise = this.api.delete(uri, body, options);
    }

    return promise
    .then(jsonify)
    .then((elements) => {
      if (elements.length === 0) return Promise.resolve([]);
      let instancesPromises = [];
      for (let element of elements) {
        instancesPromises.push(this.instanceFromApi(element));
      }
      return Promise.all(instancesPromises);
    });
  }

  static addLocaleInSuffixIfNecessary(suffix: string, options: GetAllOptions = {}): string {
    if (this.isMultilang && suffix.indexOf('locale=') === -1) {
      if (suffix.indexOf('?') === -1) {
        suffix += '?locale='
      } else {
        suffix += '&locale=';
      }
      
      suffix += this.api.state.language;
      
      if (options.getRefLocale) {
        suffix += '&reflocale=' + this.api.state.refLanguage;
      }
    }
    return suffix
  }

  addLocaleInSuffixIfNecessary(suffix: string, options: GetAllOptions = {}): string {
    if (this.isMultilang && suffix.indexOf('locale=') === -1) {
      if (suffix.indexOf('?') === -1) {
        suffix += '?locale='
      } else {
        suffix += '&locale=';
      }
      
      suffix += this.api.state.language;
    }
    return suffix
  }

  static getAll<T extends typeof Model>(this: T, suffix: string = '', options: GetAllOptions = {} ): Promise<Array<InstanceType <T>>> {
    suffix = this.addLocaleInSuffixIfNecessary(suffix, options);
    let route = options.route || this.deco.target.getAllRoute();
    let response: any;
    return this.api.get(route + suffix, options)
    .then(jsonify)
    .then((elements) => {
      response = JSON.parse(JSON.stringify(elements));
      if (elements.length === 0) return Promise.resolve([]);
      let instancesPromises = [];
      for (let element of elements) {
        instancesPromises.push(this.instanceFromApi(element/*, trackedData*/));
      }
      return Promise.all(instancesPromises);
    }).then((elements) => {
      if (options.includeResponse === undefined || options.includeResponse === true) {
        (elements as any)._response = response;
      }
      return elements;
    });
  }

  static getOneWithId<T extends typeof Model>(this: T, id: string, suffix: string = '', options: GetOneOptions = {}): Promise<InstanceType<T>> {
    suffix = this.addLocaleInSuffixIfNecessary(suffix, options);
    let route = options.route || this.deco.target.getOneRoute(id);
    let response: any;
    return this.api.get(route + suffix, options)
    .then(jsonify)
    .then((element) => {
      response = Object.assign({}, element);
      if (!element) return element;
      return this.instanceFromApi(element);
    }).then((element) => {
      if (options.includeResponse === undefined || options.includeResponse === true) {
        (element as any)._response = response;
        return element;
      }
    });
  }

  static getOneWithQuery<T extends typeof Model>(this: T): Promise<InstanceType<T>> {
    // TODO: getOneWithQuery
    throw new Error('Not implemented yet');
  }

  static instanceFromElement<T extends typeof Model>(this: T, element: any): InstanceType<T> {
    return new this.deco.target;
  }

  static instanceFromApi<T extends typeof Model>(this: T, element: any): Promise<InstanceType<T>> {
    let instance = this.instanceFromElement(element);

    if (element.id) instance.id = element.id;
    if (element._createdAt) instance._createdAt = moment(element._createdAt).toDate();
    if (element._createdBy) instance._createdBy = element._createdBy;
    if (element._updatedAt) instance._updatedAt = moment(element._updatedAt).toDate();
    if (element._updatedBy) instance._updatedBy = element._updatedBy;
    if (element._refLocales) instance._refLocales = element._refLocales;

    let fromApiPromises = [];
    for (let key of Object.keys(element)) {
      if (!instance.deco.propertyTypes[key]) {
        // previously: we used to ignore keys that have not been flaged as input by the @io.input decorator
        // now: we keep them to help auto with autofetch feature
        // in the future we could keep only autofetched properties, this should not be too hard
        instance[key] = element[key];
        continue;
      }
      // determine the key type
      let type: TypeDecorator = instance.deco.propertyTypes[key];
      let options: any = instance.deco.propertyTypesOptions[key];
  
      fromApiPromises.push(
        type.fromApi(key, element[key], options, element, instance.deco.target).then((value) => {
          instance[key] = value;
        })
      );
    }

    return Promise.all(fromApiPromises).then(() => {
      return instance;
    });
  }

  static instanceFromUnclassedElement <T extends typeof Model>(this: T, element: any): InstanceType<T> {
    let instance = this.instanceFromElement(element);
    if (element.id) instance.id = element.id;
    if (element._createdAt) instance._createdAt = moment(element._createdAt).toDate();
    if (element._createdBy) instance._createdBy = element._createdBy;
    if (element._updatedAt) instance._updatedAt = moment(element._updatedAt).toDate();
    if (element._updatedBy) instance._updatedBy = element._updatedBy;
    if (element._refLocales) instance._refLocales = element._refLocales;

    for (let key of Object.keys(element)) {
      if (!instance.deco.propertyTypes[key]) {
        // previously: we used to ignore keys that have not been flaged as input by the @io.input decorator
        // now: we keep them to help auto with autofetch feature
        // in the future we could keep only autofetched properties, this should not be too hard
        instance[key] = element[key];
        continue;
      }
      instance[key] = element[key];
    }
    return instance;
  }

  get _label() {
    return this.id;
  }

  save (suffix: string = '', options: SaveOptions = {}) {
    suffix = this.addLocaleInSuffixIfNecessary(suffix, options);
    let body: any = options.body || {};
    let toApiPromises = [];
    for (let property of Object.keys(this.deco.propertyTypes)) {
      let type: TypeDecorator = this.deco.propertyTypes[property];
      let options: any = this.deco.propertyTypesOptions[property];

      if (this.deco.propertyFromApiOnly.includes(property)) {
        continue;
      }

      toApiPromises.push(
        type.toApi(property, this[property], options, this, this.deco.target).then((value) => {
          body[property] = value;
        })
      );
    }
    let response: any;
    return Promise.all(toApiPromises).then(() => {
      return this.fixBodyIfFilesToUpload(body, options);
    }).then((body) => {
      let route = options.route || this.postRoute();
      return this.api.post(route + suffix, body, options);
    }).then(jsonify).then((element) => {
      response = Object.assign({}, element);
      return this.deco.target.instanceFromApi(element).then((instance) => {
        instance._saveResponse = element;
        return instance;
      });
    }).then((element) => {
      if (options.includeResponse === undefined || options.includeResponse === true) {
        (element as any)._response = response;
        return element;
      }
    });
  }

  fixBodyIfFilesToUpload(body: any, options: FixBodyOptions = {}): Promise<any> {
    let form = new FormData();
    let filesToUpload = false;
    //let filePromises = [];
    for (let property of Object.keys(body)) {
      let type: TypeDecorator = this.deco.propertyTypes[property];
      let options: any = this.deco.propertyTypesOptions[property];
      if (type === undefined || type.name !== 'file' && type.name !== 'files' && body[property] !== null && body[property] !== undefined) {
        // TODO: here try to do a JSON.stringify of the value
        // and then a JSON.parse on the API side in order to
        // properly send and get the data in the fields appended
        // via the form-data thing
        // exemple: add metadata to products while also uploading files
        let value = JSON.stringify(body[property])
        form.append(property, value);
      } else if (type.name === 'file' && body[property] && typeof body[property] === 'object') {
        if (body[property].toUpload !== true) {
          body[property] = undefined; // remove the data from the body, because it must not be changed on server side
        } else {
          filesToUpload = true;
          const blob = body[property].replaced ? body[property].replaced : body[property];
          form.append(property, blob, body[property].name);
          if (body[property].blobs) {
            for (let format of Object.keys(body[property].blobs)) {
              form.append(property + '_preview', body[property].blobs[format], body[property].name);
            }
          }
        }
      } else if (type.name === 'files' && Array.isArray(body[property])) {
        // for (let file of (body[property] as UxFileItemArray<UxFileItem>)) {
        //   if (file.toUpload === true) {
        //     filesToUpload = true;
        //     const blob: Blob = file.replaced ? file.replaced : (file as File);
        //     form.append(property, blob, file.name);
        //     if (file.blobs) {
        //       for (let format of Object.keys(file.blobs)) {
        //         form.append(property + '_preview', file.blobs[format], file.name);
        //       }
        //     }
        //   }
        // }
        // if ((body[property] as UxFileItemArray<UxFileItem>).removedFiles) {
        //   body[`${property}_remove`] = [];
        //   for (let removedFile of (body[property] as UxFileItemArray<UxFileItem>).removedFiles) {
        //     body[`${property}_remove`].push(removedFile.filename);
        //   }
        //   form.append(`${property}_remove`, JSON.stringify(body[`${property}_remove`]));
        // }
        // if ((body[property] as UxFileItemArray<UxFileItem>).sortFiles) {
        //   body[`${property}_sort`] = [];
        //   for (let sortFile of (body[property] as UxFileItemArray<UxFileItem>).sortFiles) {
        //     body[`${property}_sort`].push(sortFile.filename);
        //   }
        //   form.append(`${property}_sort`, JSON.stringify(body[`${property}_sort`]));
        // }
        // body[property] = 'changed'; // the body of the property must be 'changed' to indicate that there are changes in this property
        // form.append(property, 'changed');
      }
    }
    if (filesToUpload) {
      // fix options and return formData instance
      options.bodyFormat = 'FormData';
      return Promise.resolve(form);
    } else {
      // return the original body
      return Promise.resolve(body);
    }
  }

  remove(suffix: string = '', options: RemoveOptions = {}) {
    let route = options.route || this.deleteRoute(this.id);
    return this.api.delete(route + suffix, options).then(jsonify);
  }

  updateInstanceFromElement <T extends Model>(this: T, element: any, properties?: Array<string>): Promise<T> {
    let fromApiPromises = [];
    for (let property of Object.keys(element)) {
      if (!this.deco.propertyTypes[property]) continue;
      if (properties && properties.indexOf(property) === -1) continue;
      
      let type: TypeDecorator = this.deco.propertyTypes[property];
      let options: any = this.deco.propertyTypesOptions[property];
  
      fromApiPromises.push(
        type.fromApi(property, element[property], options, element, this.deco.target).then((value) => {
          this[property] = value;
        })
      );
    }
    return Promise.all(fromApiPromises).then(() => {
      if (element._refLocales) this._refLocales = element._refLocales;
      if (element._createdAt) this._createdAt = element._createdAt;
      if (element._createdBy) this._createdBy = element._createdBy;
      if (element._updatedAt) this._updatedAt = element._updatedAt;
      if (element._updatedBy) this._updatedBy = element._updatedBy;
      return this;
    });
  }

  updateInstanceFromUnclassedElement <T extends Model>(this: T, element: any, properties?: Array<string>): T {
    for (let property of Object.keys(element)) {
      if (!this.deco.propertyTypes[property]) continue;
      if (properties && properties.indexOf(property) === -1) continue;
      this[property] = element[property];
    }
    if (element._refLocales) this._refLocales = element._refLocales;
    if (element._createdAt) this._createdAt = element._createdAt;
    if (element._createdBy) this._createdBy = element._createdBy;
    if (element._updatedAt) this._updatedAt = element._updatedAt;
    if (element._updatedBy) this._updatedBy = element._updatedBy;
    return this;
  }

  unClass(): any {
    let element: any = {};
    for (let prop in this.deco.propertyTypes) {
      element[prop] = this[prop];
    }
    return element;
  }

  updateProperties(suffix: string = '', properties: Array<string>, options: UpdatePropertiesOptions = {}) {
    suffix = this.addLocaleInSuffixIfNecessary(suffix);
    let body: any = {};
    let toApiPromises = [];
    for (let property of properties) {
      if (!this.deco.propertyTypes[property]) continue;
      let type: TypeDecorator = this.deco.propertyTypes[property];
      let options: any = this.deco.propertyTypesOptions[property];

      if (this.deco.propertyFromApiOnly.includes(property)) {
        continue;
      }

      toApiPromises.push(
        type.toApi(property, this[property], options, this, this.deco.target).then((value) => {
          body[property] = value;
        })
      );
    }
    let response: any;
    return Promise.all(toApiPromises).then(() => {
      return this.fixBodyIfFilesToUpload(body, options);
    }).then((body) => {
      let route = options.route || this.putRoute(this.id);
      return this.api.put(route + suffix, body, options);
    }).then(jsonify).then((element) => {
      response = Object.assign({}, element);
      this.validationController.reset();
      if (options.includeResponse === undefined || options.includeResponse === true) {
        (this as any)._updateResponse = element;
        (this as any)._response = response;
      }
      if (options.updateInstanceWithResponse === undefined || options.updateInstanceWithResponse === true) {
        return this.updateInstanceFromElement(element, properties).then((instance) => {
          (instance as any)._response = response;
          return instance;
        });
      } else {
        return this;
      }
    });
  }

  getFilePreview(property: string, format: string, options?: FilePreviewOptions): Promise<Blob | null> {
    let etag = options && options.etag ? options.etag : null;
    let fileId = options && options.fileId ? options.fileId : null;
    let type: TypeDecorator = this.deco.propertyTypes[property];
    if (type.name !== 'file' && type.name !== 'files') return Promise.resolve(null);
    if (type.name === 'files' && !fileId) return Promise.resolve(null);
    let requestOptions: RequestOption = {};
    if (etag) requestOptions.etag = etag;
    else if (this[property] && this[property].filename) requestOptions.etag = this[property].filename;
    fileId = (type.name === 'files' || fileId) ? `&fileId=${fileId}` : '';
    let route = options && options.route || this.getOneRoute(this.id);
    //let requestId = route + '?download=' + property + '&preview=' + format + fileId + '&etag=' + etag;
    let promise = this.api.get(route + '?download=' + property + '&preview=' + format + fileId, requestOptions).then((response) => {
      return response.blob();
    }).then((blob) => { 
      return blob;
    });
    return promise;
  }

  getFilePreviewUrl(property: string, format: string, options?: FilePreviewOptions): Promise<string | null> {
    return this.getFilePreview(property, format, options).then((blob) => {
      if (blob) {
        return URL.createObjectURL(blob);
      } else {
        return null;
      }
    })
  }

  getUxFilePreviewData(property: string, file: UxFileItem, format: string): Promise<void> {
    let type: TypeDecorator = this.deco.propertyTypes[property];
    if (type.name !== 'file' && type.name !== 'files') return Promise.resolve(null);
    return this.api.get(this.getOneRoute(this.id) + '?download=' + property + '&fileId=' + file.filename + '&preview=' + format).then((response) => {
      return response.blob();
    }).then((blob) => {
      if (blob) {
        file.previewData = URL.createObjectURL(blob);
      }
    });
  }

  getUxFileData(property: string, file: UxFileItem):  Promise<Blob | UxFileItem> | null {
    let type: TypeDecorator = this.deco.propertyTypes[property];
    let url : string = null;
    if (type.name !== 'file' && type.name !== 'files') return null;
    url = this.getOneRoute(this.id) + '?download=' + property + '&fileId=' + file.filename;
    return this.api.get(url).then((response) => {
      return response.blob();
    }).then((blob) => {
      if (blob) {
        file.previewData = URL.createObjectURL(blob);
        file.filename = url;
        return file;
      }
      return null;
    });
  }

  validationRules() {
    let rules: any;
    for (let key in this.deco.propertyTypes) {
      let type: TypeDecorator = this.deco.propertyTypes[key];
      let options: any = this.deco.propertyTypesOptions[key];
      let validation = this.deco.propertyValidations[key] || null;
      rules = (rules || ValidationRules).ensure(key);
      rules = rules.satisfiesRule(`type:${type.name}`, options);
      for (let validate of validation || []) {
        if (validate.type === 'required') {
          rules = rules.required();
        }  else if (validate.type === 'email') {
          rules = rules.email();
        } else if (validate.type === 'minLength') {
          rules = rules.minLength(validate.options.minLength);
        }  else if (validate.type === 'maxLength') {
          rules = rules.maxLength(validate.options.maxLength);
        } else if (validate.type === 'slug') {
          rules = rules.matches(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/);
        } else {
          let options = Object.assign(validate.options, {key: key, instance: this, target: this.constructor});
          rules = rules.satisfiesRule(`validate:${validate.type}`, validate.options);
        }
      }
    }
    return rules;
  }

  validate(): Promise<boolean> {
    let rules = this.validationRules();
    let validator = Container.instance.get(Validator);
    return validator.validateObject(this, rules.rules).then((result) => {
      // return true if the validation doesn't reject
      return Promise.resolve(true);
    });
  }

  private _validationController: ValidationController;
  get validationController(): ValidationController {
    if (!this._validationController) {
      this._validationController = Container.instance.get(ValidationControllerFactory).create();
      // this._validationController.addRenderer(new AureliaUXFormRenderer());
      this.validationRules().on(this);
    }
    return this._validationController;
  }

  static get baseroute(): string {
    return this.deco.baseroute;
  }

  static getAllRoute(): string { return this.baseroute + '/'; }
  static getOneRoute(elementId: string): string { return this.baseroute + `/${elementId}`; }
  static postRoute(): string { return this.baseroute + '/'; }
  static putRoute(elementId: string): string { return this.baseroute + `/${elementId}`; }
  static deleteRoute(elementId: string): string { return this.baseroute + `/${elementId}`; }

  getRoute(): string {
    return this.deco.baseroute + '/';
  }

  getOneRoute(elementId: string): string {
    return this.deco.baseroute + `/${elementId}`;
  }

  postRoute(): string {
    return this.deco.baseroute + '/';
  }

  putRoute(elementId: string): string {
    return this.deco.baseroute + `/${elementId}`;
  }

  deleteRoute(elementId: string): string {
    return this.deco.baseroute + `/${elementId}`;
  }

  get(propertyName: string) {
    return (this as any)[propertyName];
  }

  set(propertyName: string, value: any) {
    (this as any)[propertyName] = value;
  }

}
