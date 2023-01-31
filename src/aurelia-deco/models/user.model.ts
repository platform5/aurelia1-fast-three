import { model, Model, type, validate, form, TypeDecorator, jsonify } from '../deco';
import { uniqueByApp } from '../decorators/validate';

@model('/user')
export class UserModel extends Model {

  @type.id
  id: string;

  @type.string
  @validate.required
  @form.label('user.Firstname')
  firstname: string = '';

  @type.string
  @validate.required
  @form.label('user.Lastname')
  lastname: string = '';

  @type.string
  @validate.required
  @validate.email
  @form.label('user.Email')
  @uniqueByApp
  email: string = '';

  @type.boolean
  @validate.required
  public emailValidated: boolean = false;

  @type.string
  @validate.required
  @form.label('user.Mobile')
  @uniqueByApp
  //@validate.internationalPhoneNumber(['ch'])
  mobile: string = '';

  @type.boolean
  @validate.required
  public mobileValidated: boolean = false;

  @type.boolean
  @validate.required
  @form.label('user.Enable double authentication')
  requireDoubleAuth: boolean = false;

  @type.array({type: 'string'})
  @form.label('user.Roles')
  roles: Array<string> = [];

  @type.boolean
  hideOnboarding: boolean = false;

  createAccount (options: any = {}) {
    let body: any = options.body || {};
    let toApiPromises = [];
    for (let property of Object.keys(this.deco.propertyTypes)) {
      let type: TypeDecorator = this.deco.propertyTypes[property];
      let options: any = this.deco.propertyTypesOptions[property];

      toApiPromises.push(
        type.toApi(property, this[property], options, this, this.deco.target).then((value) => {
          body[property] = value;
        })
      );
    }
    return Promise.all(toApiPromises).then(() => {
      return this.api.post(UserModel.baseroute + '/create-account', body, options);
    }).then(jsonify).then((element) => {
      if (element.token) {
        return element;
      } else {
        return this.deco.target.instanceFromApi(element);
      }
    });
  }

  validAccountCreationToken(method: 'email' | 'mobile', token: string, code: string) {
    let body: any = {
      token: token
    };
    if (method === 'email') body.emailCode = code;
    if (method === 'mobile') body.mobileCode = code;
    return this.api.post(UserModel.baseroute + '/create-account', body).then(jsonify).then((element) => {
      if (element.token) {
        return element;
      } else {
        return this.deco.target.instanceFromApi(element);
      }
    });
  }

  get _label() {
    return this.firstname + ' ' + this.lastname;
  }
}
