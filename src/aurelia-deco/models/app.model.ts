import { model, Model, type, validate, form } from '../deco';

@model('/app')
export class AppModel extends Model {

  @type.id
  id: string;

  @type.string
  @validate.required
  @form.label('app.form.App Name')
  name: string = 'My New App';

  @type.string({textarea: true})
  description: string = '';

  @type.file({accepted: ['image/*', 'application/pdf'], previewsFormats: ['160', '320', '320:320'], defaultPreview: '320:320'})
  public image: any = null;

  @type.string
  primaryColor: string = '';

  @type.string
  primaryForegroundColor: string = '';

  @type.string
  primaryLightColor: string = '';

  @type.string
  primaryLightForegroundColor: string = '';

  @type.string
  primaryDarkColor: string = '';

  @type.string
  primaryDarkForegroundColor: string = '';

  @type.string
  accentColor: string = '';

  @type.string
  accentForegroundColor: string = '';

  @type.string
  accentLightColor: string = '';

  @type.string
  accentLightForegroundColor: string = '';

  @type.string
  accentDarkColor: string = '';

  @type.string
  accentDarkForegroundColor: string = '';

  @type.array({type: 'object', objectOptions: {
    keys: {
      key: {type: 'string'},
      last4: {type: 'string'},
      name: {type: 'string'},
      expires: {type: 'date', dateFormat: 'DD-MM-YYYY'},
      active: {type: 'boolean'}
    }
  }})
  publicKeys: Array<any> = [];

  @type.array({type: 'object', objectOptions: {
    keys: {
      key: {type: 'string'},
      last4: {type: 'string'},
      name: {type: 'string'},
      expires: {type: 'date', dateFormat: 'DD-MM-YYYY'},
      active: {type: 'boolean'}
    }
  }})
  privateKeys: Array<any> = [];
  
  @type.boolean
  @validate.required
  @form.label('app.form.Open Registration')
  @form.hint('Any visitor is allowed to create an account for this app')
  openUserRegistration: boolean = false;

  @type.select({options: ['emailOrMobile', 'emailAndMobile', 'emailOnly', 'mobileOnly', 'none']})
  @validate.required
  @form.label('app.form.Validation Method')
  @form.hint('When a visitor creates an account, by which method should we require validation ?')
  createAccountValidation: 'emailOrMobile' | 'emailAndMobile' | 'emailOnly' | 'mobileOnly' | 'none' = 'emailOrMobile';

  @type.boolean
  @form.label('app.form.Enable Double Authentication')
  requireDoubleAuth: boolean = true;

  @type.select({options: ['auto', 'email', 'sms']})
  @form.label('app.form.What is the prefered method for Double Authentication ?')
  doubleAuthMethod: string = 'auto';

  @type.array({type: 'string'})
  @form.label('app.form.Roles available for the app users')
  availableRoles: Array<string> = ['admin', 'user', 'shop'];

  @type.array({type: 'string'})
  @form.label('app.form.Roles that allow user management')
  adminUserRoles: Array<string> = ['admin', 'user'];

  @type.boolean
  @form.label('app.form.Active Shop in the App ?')
  enableShop: boolean = false;

  @type.boolean
  @form.label('app.form.Allow creation of several shops per App ?')
  enableMultipleShops: boolean = false;

  @type.array({type: 'string'})
  @form.label('app.form.Roles that allow shop management')
  adminShopRoles: Array<string> = ['admin', 'shop'];

  @type.boolean
  @form.label('app.form.Active Three Data in the App ?')
  enableThree: boolean = false;

  @type.array({type: 'string'})
  @form.label('app.form.Roles that allow three data management')
  adminThreeRoles: Array<string> = ['admin', 'three'];

  @type.array({type: 'string'})
  @form.label('app.form.Locales')
  locales = ['fr', 'en'];

  @type.string
  @form.label('app.form.Default Locale')
  defaultLocale = 'fr';

  @type.string
  smtpConfigHost: string = '';

  @type.integer
  smtpConfigPort: number = 587;

  @type.string
  smtpConfigUser: string = '';

  @type.string
  smtpConfigPassword: string = '';

  @type.boolean
  smtpConfigSecure: boolean = false;

  @type.string
  smtpConfigFromName: string = '';

  @type.string
  smtpConfigFromEmail: string = '';

  @type.boolean
  pushEnabled: boolean = false;

  @type.string
  pushGmId: string = '';

  @type.string({textarea: true})
  pushApnCert: string = '';

  @type.string({textarea: true})
  pushApnKey: string = '';

  @type.string
  pushApnPass: string = '';

  @type.boolean
  pushApnProduction: boolean = false;

  @type.string
  pushTopic: string = '';

  get _label() {
    return this.name;
  }
}
