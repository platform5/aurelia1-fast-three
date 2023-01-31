import { customElement, bindable, children } from 'aurelia-templating';
import { inject } from 'aurelia-dependency-injection';
import { StyleEngine, UxComponent } from '@aurelia-ux/core';
import { ArDrawerTheme } from './ar-drawer-theme';
import { getLogger, Logger } from 'aurelia-logging';
import { EventAggregator } from 'aurelia-event-aggregator';

import { noView, customAttribute, Container } from 'aurelia-framework';

@inject(Element, StyleEngine, EventAggregator)
@customElement('ar-drawer')
export class ArDrawer implements UxComponent {

  @bindable id: string;
  @bindable position: string = 'left'; // left, top, right, bottom
  @bindable animate: boolean = true;
  @bindable fullScreen: boolean = false;
  @bindable overlay: boolean = false;
  @bindable showBar: boolean = false;
  @bindable title: string = '';

  private log: Logger;

  @bindable public theme: ArDrawerTheme;
  
  opened: boolean = false;
  private picker: Element;
  private overlayElement: HTMLElement;
  private overlayShowed: boolean = false;

  public static zIndexRef: number = 200;
  public static drawerLayers: number = 0;
  private zIndex: number = 200;

  private handleResize: EventListener;

  constructor(private element: HTMLElement, public styleEngine: StyleEngine, private eventAggregator: EventAggregator) {
    this.log = getLogger('ar-drawer');
    this.handleResize = e => {
    };
  }

  public bind() {
    const element = this.element;
    this.themeChanged(this.theme);
  }

  public attached() {
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
    if (this.fullScreen || !this.fullScreen) this.moveToBodyTag();
  }

  public detached() {
    window.removeEventListener('resize', this.handleResize);
    if (this.fullScreen || !this.fullScreen) this.removeFromBodyTag();
  }

  public moveToBodyTag() {
    let body: HTMLBodyElement = (document.getElementsByTagName('BODY')[0] as HTMLBodyElement);
    body.appendChild(this.element);
    this.overlayElement = document.createElement('div');
    this.overlayElement.classList.add('drawer-overlay');
  }

  public removeFromBodyTag() {
    document.getElementsByTagName('BODY')[0].removeChild(this.element);
  }

  public showOverlay() {
    if (this.overlayShowed) return;
    if (this.animate) {
      this.overlayElement.classList.remove('visible');
      this.overlayElement.classList.add('animate');
    }
    let body: HTMLBodyElement = (document.getElementsByTagName('BODY')[0] as HTMLBodyElement);
    body.insertBefore(this.overlayElement, this.element);
    this.overlayShowed = true;
    setTimeout(() => {
      this.overlayElement.classList.add('visible');
    }, 10);
    Array.from(document.querySelectorAll('.vscroll')).forEach(i => i.classList.add('vscroll-canceled-by-drawer-overlay'));
    Array.from(document.querySelectorAll('.hscroll')).forEach(i => i.classList.add('hscroll-canceled-by-drawer-overlay'));
    this.overlayElement.addEventListener('click', (event) => {
      this.close();
      event.stopPropagation();
      return false;
    });
  }

  public hideOverlay() {
    if (!this.overlayShowed) return;
    let body: HTMLBodyElement = (document.getElementsByTagName('BODY')[0] as HTMLBodyElement);
    Array.from(document.querySelectorAll('.vscroll-canceled-by-drawer-overlay')).forEach(i => i.classList.remove('vscroll-canceled-by-drawer-overlay'));
    Array.from(document.querySelectorAll('.hscroll-canceled-by-drawer-overlay')).forEach(i => i.classList.remove('hscroll-canceled-by-drawer-overlay'));
    if (!this.animate) {
      body.removeChild(this.overlayElement);
    } else {
      this.overlayElement.classList.remove('visible');
      setTimeout(() => {
        body.removeChild(this.overlayElement);
      }, 500);
    }
    this.overlayShowed = false;
  }

  public themeChanged(newValue: any) {
    if (newValue != null && newValue.themeKey == null) {
      newValue.themeKey = 'ar-drawer';
    }
    this.styleEngine.applyTheme(newValue, this.element);
  }

  public open() {
    ArDrawer.drawerLayers++;
    this.setZIndex();
    let notice = false;
    if (!this.opened) {
      notice = true;
    }
    this.opened = true;
    if (notice) this.noticeApp();
    if (this.overlay) this.showOverlay();
  }

  public close() {
    ArDrawer.drawerLayers--;
    let notice = false;
    if (this.opened) {
      notice = true;
    }
    this.opened = false;
    if (notice) this.noticeApp();
    if (this.overlay) this.hideOverlay();
  }

  public setZIndex()  {
    this.zIndex = ArDrawer.zIndexRef + ArDrawer.drawerLayers;
  }

  public toggle() {
    if (this.opened) this.close();
    else this.open();
  }

  public noticeApp() {
    if (this.opened) {
      this.eventAggregator.publish('ar-drawer-open', {id: this.id});
    } else {
      this.eventAggregator.publish('ar-drawer-close', {id: this.id});
    }
    this.eventAggregator.publish('ar-drawer-toggle', {id: this.id, opened: this.opened});
  }

}

@customAttribute('ar-drawer-toggle')
@noView
@inject(Element)
export class ArDrawerToggleAttribute {

  private subs = [];
  private value: string;

  constructor(private element: Element) {
  }

  attached() {
    let sub = this.onClick.bind(this);
    this.subs.push(sub);
    this.element.addEventListener('click', sub);
  }

  detached() {
    if (this.subs) for (let sub of this.subs) {
      this.element.removeEventListener('click', sub);
    }
  }

  onClick(event) {
    event.preventDefault();
    let vm = getArDrawerFromId(this.value);
    if (vm) {
      vm.toggle();
    }
  }
}

@customAttribute('ar-drawer-open')
@noView
@inject(Element)
export class ArDrawerOpenAttribute {

  private subs = [];
  private value: string;

  constructor(private element: Element) {
  }

  attached() {
    let sub = this.onClick.bind(this);
    this.subs.push(sub);
    this.element.addEventListener('click', sub);
  }

  detached() {
    if (this.subs) for (let sub of this.subs) {
      this.element.removeEventListener('click', sub);
    }
  }

  onClick(event) {
    event.preventDefault();
    let vm = getArDrawerFromId(this.value);
    if (vm) {
      vm.open();
    }
  }
}

@customAttribute('ar-drawer-close')
@noView
@inject(Element)
export class ArDrawerCloseAttribute {

  private subs = [];
  private value: string;

  constructor(private element: Element) {
  }

  attached() {
    let sub = this.onClick.bind(this);
    this.subs.push(sub);
    this.element.addEventListener('click', sub);
  }

  detached() {
    if (this.subs) for (let sub of this.subs) {
      this.element.removeEventListener('click', sub);
    }
  }

  onClick(event) {
    event.preventDefault();
    let vm = getArDrawerFromId(this.value);
    if (vm) {
      vm.close();
    }
  }
}

function getArDrawerFromId(id: string): ArDrawer | null {
  let element: any = document.querySelector('#' + id);
  if (element && element.au && element.au.controller && element.au.controller.viewModel) {
    let vm = element.au.controller.viewModel;
    if (vm instanceof ArDrawer) {
      return vm;
    }
  }
  return null;
}

export function openDrawer(id) {
  let vm = getArDrawerFromId(id);
  if (vm) vm.open();
}

export function closeDrawer(id) {
  let vm = getArDrawerFromId(id);
  if (vm) vm.close();
}

export function toggleDrawer(id) {
  let vm = getArDrawerFromId(id);
  if (vm) vm.toggle();
}

export function onDrawerStatusChanged(id, settings = {setup: 'attached', teardown: 'detached', onChanged: 'drawerStatusChanged'}) {
  let eventAggregator = Container.instance.get(EventAggregator);
  return function(target: any) {
    let subscription;
    const originalSetup = typeof settings === 'object' && settings.setup
      ? target.prototype[settings.setup]
      : target.prototype.bind
    const originalTeardown = typeof settings === 'object' && settings.teardown
      ? target.prototype[settings.teardown]
      : target.prototype.unbind;
  
    target.prototype[typeof settings === 'object' && settings.setup ? settings.setup : 'bind'] = function () {
  
      if (typeof settings == 'object' &&
        typeof settings.onChanged === 'string' &&
        !(settings.onChanged in this)) {
        throw new Error('Provided onChanged handler does not exist on target VM');
      }
  
      subscription = eventAggregator.subscribe('ar-drawer-toggle', (data) => {
        if (data.id === id) {
          if (typeof settings == 'object' &&
            typeof settings.onChanged === 'string') {
            this[settings.onChanged](data.opened);
          }
        }
      })
  
      if (originalSetup) {
        return originalSetup.apply(this, arguments);
      }
    }
  
    target.prototype[typeof settings === 'object' && settings.teardown ? settings.teardown : 'unbind'] = function () {
      
      subscription.dispose();

      if (originalTeardown) {
        return originalTeardown.apply(this, arguments);
      }
    }
  }
}
