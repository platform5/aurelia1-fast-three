import { Model } from '../decorators/model';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, NewInstance, transient } from 'aurelia-framework';
import { getLogger } from 'aurelia-logging';
const log = getLogger('ensure-model');

@transient()
@inject(NewInstance.of(EventAggregator))
export class EnsureModel<T extends typeof Model> {

  private model: T;
  private suffix: string;
  private getAllOptions: any;
  public instances: {
    [key: string]: InstanceType<T> | null
  };

  private language: string;

  private idsToFetch: string[] = [];
  private fetching: boolean = false;

  constructor(private eventAggregator: EventAggregator) { }

  public init(model: T, suffix?: string, getAllOptions?: any, language?: string) {
    this.model = model;
    this.suffix = suffix || '';
    this.getAllOptions = getAllOptions || {};
    this.instances = {};
    if (language) {
      this.language = language;
    }
  }

  public async get(id: string): Promise<InstanceType<T> | null> {
    if (this.instances[id] !== undefined) {
      return this.instances[id];
    }
    this.ensureIds([id]);
    return new Promise((resolve) => {
      this.eventAggregator.subscribeOnce(`fetched-${id}`, resolve);
    });
  }

  public async reload(id: string): Promise<InstanceType<T> | null> {
    this.idsToFetch.push(id);
    this.ensureIds([id]);
    return new Promise((resolve) => {
      this.eventAggregator.subscribeOnce(`fetched-${id}`, resolve);
    });
  }

  public reloadAll(): void {
    const ids = Object.keys(this.instances);
    this.idsToFetch.push(...ids);
    this.fetchNextItems();
  }

  public async ensureIds(ids: string[], force = false): Promise<InstanceType<T>[]> {
    const idsToAdd = ids.filter(i => force || this.instances[i] === undefined).filter(i => this.idsToFetch.indexOf(i) === -1);
    this.idsToFetch.push(...idsToAdd);
    this.fetchNextItems();

    const promises: Promise<any>[] = [];
    for (const id of idsToAdd) {
      promises.push(new Promise((resolve) => {
        this.eventAggregator.subscribeOnce(`fetched-${id}`, resolve);
      }));
    }
    await Promise.all(promises);
    return ids.map(id => this.instances[id]);
  }

  private async fetchNextItems(): Promise<void> {
    if (this.fetching) {
      return; // at the end of any fetch, if the idsToFetch array is not empty we automatically call fetchNextItems again
    }
    this.fetching = true;
    const ids = this.idsToFetch.splice(0, 50);
    let suffix = `?id=${ids}${this.suffix}`;
    if (this.language && suffix.indexOf('&locale=') === -1) {
      suffix += `&locale=${this.language}`;
    }
    try {
      const options = Object.assign({}, this.getAllOptions);
      const instances = await this.model.getAll(suffix, options) as InstanceType<T>[];
      for (let instance of instances) {
        this.instances[instance.id] = instance;
        this.eventAggregator.publish(`fetched-${instance.id}`, instance);
      }
      for (const id of ids) {
        // identify models that have not been found
        if (this.instances[id] === undefined) {
          this.instances[id] = null;
          this.eventAggregator.publish(`fetched-${id}`, null);
        }
      }
      this.fetching = false;
      if (this.idsToFetch.length !== 0) {
        this.fetchNextItems();
      }
    } catch (error) {
      this.fetching = false;
      throw error;
    }
  }

  public get isFetching(): boolean {
    return this.fetching;
  }
}