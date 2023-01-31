import { inject, bindable } from 'aurelia-framework';
import { NotificationController } from 'aurelia-notify';
import { StyleEngine, UxComponent } from '@aurelia-ux/core';
import { ArNotificationTheme } from './ar-notification-theme';

@inject(NotificationController, Element, StyleEngine)
export class  ArNotification implements UxComponent {

  level: any;
  notification: string;
  data: any;
  @bindable public theme:  ArNotificationTheme;

  constructor(private controller: NotificationController, private element: HTMLElement, private styleEngine: StyleEngine) {
  }

  activate(model: any) {
    this.level = model.level;
    this.notification = model.notification;
    this.data = model.data || {};
  }

  public bind() {
    this.themeChanged(this.theme);
  }

  public themeChanged(newValue: any) {
    if (newValue != null && newValue.themeKey == null) {
      newValue.themeKey = 'ar-notification';
    }
    this.styleEngine.applyTheme(newValue, this.element);
  }

  private doAction() {
    if (this.data.actionCallback && typeof this.data.actionCallback === 'function') {
      let context = this.data.actionContext || null;
      (this.data.actionCallback as () => {}).call(context);
    }
    this.controller.close();
  }
}
