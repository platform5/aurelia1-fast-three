import { model, Model, type, validate, form, PropertyValidation } from '../deco';
import { AppModel } from './app.model';

export class DynamicConfigField {
  name: string = 'New Field';
  type: 'any' | 'string' | 'integer' | 'select' | 'float' | 'boolean' | 'date' | 'array' | 'object' | 'file' | 'files' | 'model' | 'models' = 'any';
  options: any = {};
  validation: Array<PropertyValidation>;
  required: boolean = false;
  filterable: 'no' | 'auto' | 'equal' | 'number' | 'text' | 'categories' | 'tags' | 'date' | 'id' | 'ids' | 'boolean' = 'auto';
  searchable: boolean = true;
  sortable: boolean = true;
}


export interface DynamicConfigFieldEditable extends DynamicConfigField {
  onlySlug?: boolean;
  onlyEmail?: boolean;
}

@model('/dynamicconfig')
export class DynamicConfigModel extends Model {

  @type.id
  id: string;

  @type.model({model: AppModel})
  @validate.required
  @form.label('App')
  public relatedToAppId: string;

  @type.string
  @form.label('Name')
  @validate.required
  public name: string = '';

  @type.string
  @form.label('Slug')
  @form.hint('The slug is a name made only of alphanumerical caracters')
  @validate.slug
  public slug: string = '';

  @type.string
  @form.label('Label')
  @form.hint('Use ${propertyName} expressions to build this model label')
  public label: string = '';

  @type.boolean
  @form.label('Is this model public ?')
  @form.hint('If yes, anyone can access its data Otherwise, only logged in users can')
  public isPublic: boolean = false;

  @type.select({options: ['all', 'creator', 'users', 'usersWithRoles']})
  @form.label('Reading Access')
  public readingAccess: string = 'all';

  @type.array({type: 'string'})
  @form.label('Reading Roles')
  public readingRoles: Array<string> = [];
  
  @type.select({options: ['all', 'creator', 'users', 'usersWithRoles']})
  @form.label('Writing Access')
  public writingAccess: string = 'all';
  
  @type.array({type: 'string'})
  @form.label('Writing Roles')
  public writingRoles: Array<string> = [];

  @type.array({type: 'object', options: {
    keys: {
      name: {type: 'string'},
      type: {type: 'string'},
      options: {type: 'any'},
      validation: {type: 'array'},
      required: {type: 'boolean'}
    }
  }})
  @form.label('Fields')
  public fields: Array<DynamicConfigFieldEditable> = [];

  @type.boolean
  @form.label('Enable Admin Notifications')
  public enableAdminNotification = false;

  @type.boolean
  @form.label('Enable User Notifications')
  public enableUserNotification = false;

  @type.select({options: ['email'], multiple: true})
  @form.label('Notification Type')
  public notificationType: 'email' = 'email';

  @type.select({options: ['create', 'edit', 'delete'], multiple: true})
  @form.label('Notify When')
  public notifyWhen: 'create' | 'edit' | 'delete' = 'create';

  @type.string
  @form.label('Admin Notification Email')
  //@validate.email // because it can also be notify:userId
  public notificationAdminEmail: string;

  @type.string
  @form.label('Admin Notification Subject')
  public notificationAdminSubject: string;

  @type.string({textarea: true})
  @form.label('Admin Notification Content Prefix')
  public notificationAdminContentPrefix: string;

  @type.string({textarea: true})
  @form.label('Admin Notification Content Suffix')
  public notificationAdminContentSuffix: string;

  @type.string({textarea: true})
  @form.label('Admin Notification Template')
  public notificationAdminTemplate: string;

  @type.string
  @form.label('Fieldname of the model containing the email of the user')
  public notificationUserField: string;

  @type.string
  @form.label('User Notification Subject')
  public notificationUserSubject: string;

  @type.string({textarea: true})
  @form.label('User Notification Content Prefix')
  public notificationUserContentPrefix: string;

  @type.string({textarea: true})
  @form.label('User Notification Content Suffix')
  public notificationUserContentSuffix: string;

  @type.string({textarea: true})
  @form.label('User Notification Template')
  public notificationUserTemplate: string;

  @type.any
  @form.label('Policy')
  public policy: any = {};

  get _label() {
    return this.name;
  }

}
