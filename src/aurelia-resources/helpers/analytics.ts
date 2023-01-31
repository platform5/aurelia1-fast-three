import { StringHelpers } from './string';
import moment from 'moment';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Container } from 'aurelia-framework';
import { NavigationInstruction } from 'aurelia-router';
import { Logger, getLogger } from 'aurelia-logging';

let log: Logger = getLogger('analytics');

export class AnalyticEntry {
  private date: Date;
  private type: 'navigation' | 'click' | 'event' = 'navigation';
  private path: string;
  private title?: string; // or label for events
  private action?: string;
  private category?: string;
  private value?: any;

  private _isSaved: boolean = false;

  constructor(type: 'navigation' | 'click' | 'event', path: string) {
    this.date = moment().toDate();
    this.type = type;
    this.path = path;
  }

  static navigation(path: string, title: string) {
    let entry = new AnalyticEntry('navigation', path);
    entry.path = path;
    entry.title = title;
    return entry;
  }

  static click(path: string, category: string, action: string, label?: string, value?: any) {
    let entry = new AnalyticEntry('click', path);
    entry.category = category;
    entry.action = action;
    entry.title = label;
    entry.value = value;
    return entry;
  }

  static event(path: string, category: string, action: string, label?: string, value?: any) {
    let entry = new AnalyticEntry('event', path);
    entry.category = category;
    entry.action = action;
    entry.title = label;
    entry.value = value;
    return entry;
  }

  public get isSaved() {
    return this._isSaved;
  }

  public saved() {
    this._isSaved = true;
  }

  public output() {
    return {
      date: this.date,
      type: this.type,
      path: this.path,
      category: this.category,
      action: this.action,
      title: this.title,
      value: this.value,
    };
  }
}

export class Analytics {

  private sessionId: string;
  private identity: string;
  private entries: Array<AnalyticEntry> = [];

  public enableNavigationTracking: boolean = false;
  public enableClickTracking: boolean = false;
  public enableEventTracking: boolean = false;

  public saveOnNavigation: boolean = false;
  public saveOnClick: boolean = false;
  public saveOnEvent: boolean = false;

  public listenRouter: boolean = false;

  public currentPath: string = '';

  constructor(id?: string) {
    this.setSessionId(id);
  }

  public setSessionId(id?: string) {
    if (id) {
      this.sessionId = id;
    }
    else {
      this.sessionId = StringHelpers.random({charset: 'alphanumeric', length: 32});
    }
  }

  public setIdentity(identity: string) {
    this.identity = identity;
  }

  public setListeners() {
    let ea: EventAggregator = Container.instance.get(EventAggregator);
    ea.subscribe('router:navigation:success', (event: any) => {
      if (!this.listenRouter) return;
      let instruction: NavigationInstruction = event.instruction;
      this.navigation(instruction.fragment + '?' + instruction.queryString, instruction.config.name);
    });
    ea.subscribe('analytics:navigation', (event: any) => {
      if (event instanceof NavigationInstruction) {
        this.navigation(event.fragment + '?' + event.queryString, event.config.name);
      } else if (event.key) {
        this.navigation(event.key, event.fullUri);
      }
    });
    ea.subscribe('analytics:click', (event: any) => {
      if (event.key) {
        event.category = event.key; // for compatibility
      }
      this.click(event.category, event.action, event.label, event.value);
    });
    ea.subscribe('analytics:event', (event: any) => {
      if (event.key) {
        event.category = event.key; // for compatibility
      }
      this.event(event.category, event.action, event.label, event.value);
    });
    ea.subscribe('analytics:request-save', (event: any) => {
      this.save();
    });
  }

  public navigation(path: string, title?: string) {
    this.currentPath = path;
    if (!this.enableNavigationTracking) return;
    this.entries.push(AnalyticEntry.navigation(path, title));
    if (this.saveOnNavigation) this.save();
  }

  public click(category: string, action = '', label = '', value = undefined) {
    if (!this.enableClickTracking) return;
    this.entries.push(AnalyticEntry.click(this.currentPath, category, action, label, value));
    if (this.saveOnClick) this.save();
  }

  public event(category: string, action = '', label = '', value = undefined) {
    if (!this.enableEventTracking) return;
    this.entries.push(AnalyticEntry.event(this.currentPath, category, action, label, value));
    if (this.saveOnEvent) this.save();
  }

  private saveTimeout;
  public save(onlyUnsaved: boolean = true) {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      let data = [];
      for (let entry of this.entries) {
        if (entry.isSaved && onlyUnsaved) continue;
        let output: any = entry.output();
        output.sessionId = this.sessionId;
        if (this.identity) output.identity = this.identity;
        data.push(output);
        entry.saved();
      }
      let ea: EventAggregator = Container.instance.get(EventAggregator);
      ea.publish('analytics:save', data);
    }, 50);
  }

}
