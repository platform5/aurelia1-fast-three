import { model, Model, type, validate } from '../deco';

@model('/analytics')
export class AnalyticsModel extends Model {

  @type.string
  @validate.required
  sessionId: string = '';

  @type.string
  identity: string

  @type.string
  @validate.required
  type: 'navigation' | 'click' | 'event' = 'navigation';

  @type.string
  @validate.required
  path: string

  @type.string
  category: any;

  @type.string
  action: any;

  @type.string
  title: any;

  @type.string
  value: any;
}