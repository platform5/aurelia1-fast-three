import { model, Model, type, validate, form } from '../deco';

@model('/dico')
export class DicoModel extends Model {

  @type.id
  id: string;

  @type.string
  @validate.required
  @form.label('admin.dico.Key to translate')
  @form.hint('admin.dico.Avoid points')
  key: string;
  
  @type.string({textarea: true, multilang: true})
  @validate.required
  @form.label('admin.dico.Translation')
  value: string;

  @type.array({type: 'string'})
  tags: Array<string> = [];
}
