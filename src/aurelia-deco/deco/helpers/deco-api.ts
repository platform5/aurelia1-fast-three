import { Container, inject } from 'aurelia-framework';
import { HttpClient } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DecoAppState, initDecoState, clearDecoState, setLanguage, setRefLanguage, setCountryCode, setLanguages, setCountries, setCountry } from '../state';
import { Store } from 'aurelia-store';
import 'whatwg-fetch';
import { getLogger, Logger } from 'aurelia-logging';

export interface DecoInitOptions {
  container?: Container;
  language?: string;
  languages?: Array<string>;
  country?: string;
  countries?: Array<string>;
  refLanguage?: string;
  force?: boolean;
}

export interface RequestOption {
  method?: 'get' | 'post' | 'delete' | 'put';
  headers?: any;
  bodyFormat?: 'json' | 'FormData';
  etag?: string;
}

@inject(HttpClient)
export class DecoApi {

  public configured: boolean = false;
  public log: Logger;
  private initDone: boolean = false;
  public store: Store<DecoAppState>;
  public state: DecoAppState;
  public container: Container;
  private version: string = '';
  public sessionId: string = '';

  constructor(public http: HttpClient) {
    this.log = getLogger('deco-api');
  }

  public init(store: Store<DecoAppState>, options?: DecoInitOptions): Promise<any> {
    if (this.initDone && !options.force) return Promise.resolve();
    this.log.debug('deco init', options);
    
    this.container = options.container instanceof Container ? options.container : Container.instance;
    const config = this.container.get('aurelia-deco-config');
    this.log.debug('deco config', config);
    if (config.version) {
      this.version = config.version;
    }
    this.store = store;

    this.store.state.subscribe(
      (state) => this.state = (state as DecoAppState)
    );

    this.store.registerAction('initDecoState', initDecoState);
    this.store.registerAction('setLanguage', setLanguage);
    this.store.registerAction('setLanguages', setLanguages);
    this.store.registerAction('setRefLanguage', setRefLanguage);
    this.store.registerAction('setCountryCode', setCountryCode);
    this.store.registerAction('setCountry', setCountry);
    this.store.registerAction('setCountries', setCountries);
    this.store.registerAction('clearDecoState', clearDecoState);

    this.container.get(EventAggregator).subscribe('language:changed', async (language) => {
      if (typeof language !== 'string' || language.length !== 2) {
        this.log.warn('Invalid lanuage: ', language);
        return;
      }
      await this.store.dispatch(setLanguage, language);
    });

    this.container.get(EventAggregator).subscribe('country:changed', async (country) => {
      if (typeof country !== 'string' || country.length !== 2) {
        this.log.warn('Invalid lanuage: ', country);
        return;
      }
      await this.store.dispatch(setCountry, country);
    });
    
    return this.store.dispatch(initDecoState).then(() => {
      return (options && options.languages) ? this.store.dispatch(setLanguages, options.languages) : Promise.resolve();
    }).then(() => {
      return (options && options.language) ? this.store.dispatch(setLanguage, options.language) : Promise.resolve();
    }).then(() => {
      return (options && options.countries) ? this.store.dispatch(setCountries, options.countries) : Promise.resolve();
    }).then(() => {
      return (options && options.country) ? this.store.dispatch(setCountry, options.country) : Promise.resolve();
    }).then(() => {
      return (options && options.refLanguage) ? this.store.dispatch(setRefLanguage, options.refLanguage) : Promise.resolve();
    }).then(() => {
      this.initDone = true;
    });
  }

  // clearState() {
  //   if (!this.store) throw new Error('DecoApi: store is not yet defined');
  //   return this.store.dispatch(clearDecoState);
  // }

  configureHost(host: string) {
    this.http.configure((config) => {
      config
        //.useStandardConfiguration()
        .withDefaults({
          credentials: 'same-origin'
        })
        .withBaseUrl(host);
      });
    this.configured = true;
  }

  defaultOptions(options: RequestOption = {}) {
    let o: any = {
      method: 'get',
      headers: {
        "sdiosid": this.sessionId
      }
    };

    o = Object.assign({}, o, options);

    if (!o.headers['Content-Type'] && (!options.bodyFormat ||  options.bodyFormat === 'json')) {
      o.headers['Content-Type'] = 'application/json';
    }

    if (options.etag) {
      o.headers['ETAG'] = options.etag;
    }
    return o;
  }

  extendEntrpoint(entrypoint: string): string {
    if (!entrypoint.includes('download=') && this.version) {
      entrypoint += entrypoint.includes('?') ? '&' : '?';
      entrypoint += `__v=${this.version}`;
    }
    return entrypoint;
  }

  get(entrypoint: string, options: RequestOption = {}): Promise < Response > {
    if (!this.configured) throw new Error('Api must be configured before you can use it');
    return this.http.fetch(this.extendEntrpoint(entrypoint), this.defaultOptions(options));
  }

  post(entrypoint: string, body: any = {}, options: RequestOption = {}): Promise < Response > {
    if (!this.configured) throw new Error('Api must be configured before you can use it');
    let o = this.defaultOptions(options);
    o.method = 'post';
    o.body = this.normalizeBody(body, options);
    return this.http.fetch(this.extendEntrpoint(entrypoint), o);
  }

  put(entrypoint: string, body: any = {}, options: RequestOption = {}): Promise < Response > {
    if (!this.configured) throw new Error('Api must be configured before you can use it');
    let o = this.defaultOptions(options);
    o.method = 'put';
    o.body = this.normalizeBody(body, options);
    return this.http.fetch(this.extendEntrpoint(entrypoint), o);
  }

  delete(entrypoint: string, body: any = {}, options: RequestOption = {}): Promise < Response > {
    if (!this.configured) throw new Error('Api must be configured before you can use it');
    let o = this.defaultOptions(options);
    o.method = 'delete';
    o.body = this.normalizeBody(body, options);
    return this.http.fetch(this.extendEntrpoint(entrypoint), o);
  }

  private normalizeBody(body: any, options: any) {
    if (!options.bodyFormat ||  options.bodyFormat === 'json') {
      body = JSON.stringify(body);
    }
    return body;
  }
}

export function jsonify(response: Response): Promise<any> {
  if (!response || !response.json) return Promise.resolve(response);
  if (response.status === 204) {
    return Promise.resolve({});
  }
  if (response.status === 404) {
    return Promise.reject(new Error('Page not found'));
  }
  let isError = response.status > 299;
  return response.json().catch((error) => {
    console.error('Invalid JSON in', response.url);
    console.error(error);
    throw new Error('Invalid JSON response');
  }).then((jsonValue) => {
    if (isError && jsonValue.error) throw new Error(jsonValue.error);
    else if (isError) throw new Error('Unknown error');
    return jsonValue;
  });
}
