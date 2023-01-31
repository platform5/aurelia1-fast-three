import { model, Model, type, Metadata } from '../deco';
import { UserModel } from './user.model';

@model('/profile')
export class ProfileModel extends Model {

  @type.model({model: UserModel})
  public userId?: string;

  @type.file({accepted: ['image/*']})
  public picture: any;

  @type.string
  public street: string = '';

  @type.string
  public zip: string = '';

  @type.string
  public city: string = '';

  @type.string
  public country: string = '';
  
  @type.string
  public company: string = '';

  @type.string
  public department: string = '';

  @type.array({type: 'object', options: {
    keys: {
      key: {type: 'string'},
      value: {type: 'any'}
    }
  }})
  public metadata: Array<Metadata> = [];

}