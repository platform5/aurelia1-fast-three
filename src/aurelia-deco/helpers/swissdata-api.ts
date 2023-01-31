import { AuthenticationControl } from './authentication-control';
import { SwissdataGlobal } from './swissdata-global';
import { UserModel } from './../models/user.model';
import { RequestRecorder } from './request-recorder';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DecoApi, jsonify, DecoInitOptions, Store, EnsureModel } from '../deco';
import { SwissdataUser } from './../state/interfaces';
import { AureliaSwissdataConfig } from '../index';
import { SwissdataState, AppState } from '../state/interfaces';
import { Container, inject } from 'aurelia-framework';
import 'whatwg-fetch';
import { setState, authenticate, logout, waitForDoubleAuth, initSwissdataState, 
  setAccessToken, setDoubleAuthValidationToken, setApiHost,
  setLoginStep, setSwissdataStateProps, setOnline } from '../state/actions';
import { getLogger } from 'aurelia-logging';
import { Redirect, NavigationInstruction } from 'aurelia-router';
import { getI18NSetupOptions } from './i18n-setup';

const globalContexts = ['', 'gettingStarted', 'login', 'shop', 'error', 'info', 'confirmation', 'admin', 'three', 'bcf'];
const isGlobalDico = (key: string) => {
  if (key.indexOf('.') === -1) {
    return true;
  }
  if (globalContexts.includes(key)) {
    return true;
  }
  if (globalContexts.some((context) => {
    return key.indexOf(context + '.') === 0
  })) {
    return true;
  }
  return false;
}

export interface SwissdataInitOptions extends DecoInitOptions {
  
}

export class SwissdataApi extends DecoApi {

  //public configured: boolean = false; // set in parent
  //public log: Logger; // set in parent
  public state: AppState;
  private subscription: any;
  public ready: boolean = false;
  public authenticationControl: AuthenticationControl;
  public clientUrl: string = '';

  //public appState?: AppState;
  //public store?: Store<AppState>;

  public get ensureUsers(): EnsureModel<typeof UserModel> {
    return this.container.get(SwissdataGlobal).ensureUsers;
  }

  constructor(http) {
    super(http);
    this.log = getLogger('swissdata-api');
  }

  private swissdataInitDone: boolean = false;
  init(store: Store<AppState>, options?: SwissdataInitOptions): Promise<any> {
    if (this.swissdataInitDone && !options.force) return Promise.resolve();
    this.log.debug('swissdata init', options);
    return super.init(store, options).then(() => {
/*
we don't need to subscribe here, because it is done in the parent DecoApi class
      this.store.state.subscribe(
        (state) => this.state = (state as AppState)
      );
*/
      this.container.registerInstance(DecoApi, this);
      const recorder = this.container.get(RequestRecorder);
      this.authenticationControl = this.container.get(AuthenticationControl);
      let swissdataConfig: AureliaSwissdataConfig = this.container.get('aurelia-deco-config');

      this.clientUrl = swissdataConfig.clientUrl;

      this.http.configure((config) => {
        config
        //.useStandardConfiguration()
        .withDefaults({
          credentials: 'same-origin'
        })
        .withInterceptor(this.authenticationControl.responseInterceptor())
        .withInterceptor(recorder.requestInterceptor())
        .withBaseUrl(swissdataConfig.api.host);
      });
      this.store = store;
      this.store.registerAction('initSwissdataState', initSwissdataState);
      this.store.registerAction('setApiHost', setApiHost);
      this.store.registerAction('setState', setState);
      this.store.registerAction('setAccessToken', setAccessToken);
      this.store.registerAction('setDoubleAuthValidationToken', setDoubleAuthValidationToken);
      this.store.registerAction('authenticate', authenticate);
      this.store.registerAction('logout', logout);
      this.store.registerAction('waitForDoubleAuth', waitForDoubleAuth);
      this.store.registerAction('setLoginStep', setLoginStep);
      this.store.registerAction('setSwissdataStateProps', setSwissdataStateProps);
      this.store.registerAction('setOnline', setOnline);
      
      return this.store.dispatch(initSwissdataState).then(() => {
        return this.store.dispatch(setApiHost, swissdataConfig.api.host);
      }).then(() => {
        let __this = this;
        if (swissdataConfig.registerMissingTranslationKeys) {
          let ea = this.container.get(EventAggregator);
          let languages = this.state.languages;

          let timeout = 100;

          ea.subscribe('i18next.missing.key', (data) => {
            const key = data.key;
            const value = data.fallbackValue.split('.').splice(-1, 1)[0];
            const namespace = data.ns;

            let multiLangValue: any = {};
            for (let language of languages) {
              multiLangValue[language] = value;
            }

            let options = getI18NSetupOptions();

            let apiKey = options.apiKey;
            let apiHost = options.host;
            if (isGlobalDico(key)) {
              apiKey = options.translationMemoryApiKey;
              apiHost = options.translationMemoryHost || options.host;
            }
            if (namespace === 'local') {
              apiKey = options.apiKey;
              apiHost = options.host;
            }

            setTimeout(() => {
              __this.post(`${apiHost}/dico?apiKey=${apiKey}`, {key: key, value: multiLangValue});
            }, timeout);

            timeout += 100;

          });
        }
        this.configured = true;
        this.swissdataInitDone = true;
        this.ready = true;
      });
    });
  }

  // clearState() {
  //   if (!this.store) throw new Error('SwissdataApi: store is not yet defined');
  //   this.store.registerAction('clearSwissdataState', clearSwissdataState);
  //   return super.clearState().then(() => {
  //     return this.store.dispatch(clearSwissdataState);
  //   });
  // }


  setState(state: SwissdataState) {
    this.store.dispatch('setState', state);
  }

  defaultOptions(options: any = {}) {
    let o = super.defaultOptions(options);
    
    if (this.state.swissdata.accessToken) o.headers.Authorization = 'Bearer ' + this.state.swissdata.accessToken;

    return Object.assign({}, o, options);
  }

  extendEntrpoint(entrypoint: string) {
    entrypoint = super.extendEntrpoint(entrypoint);
    return this.addAppId(entrypoint);
  }

  addAppId(entrypoint: string): string {
    if (entrypoint.indexOf('apiKey=') !== -1) return entrypoint; // do not add an apiKey if one is already present
    if (entrypoint.indexOf('?') === -1) return `${entrypoint}?apiKey=${this.state.swissdata.publicKey}`;
    else return `${entrypoint}&apiKey=${this.state.swissdata.publicKey}`;
  }

  isReady(): Promise<void> {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let interval = setInterval(() => {
        if (this.ready) {
          clearInterval(interval);
          if (timeout) clearTimeout(timeout);
          resolve();
        }
      }, 50);
      let timeout = setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Swissdata not ready after 5 seconds [timeout]'));
      }, 5000);
    });
  }

  private checkStatusInterval: any;
  private checkStatus() {
    this.get('/status').then(jsonify).then((response) => {
      if (response && response.status === 'OK' && this.state.swissdata.online !== true) {
        this.store.dispatch(setOnline, true);
        let ea = this.container.get(EventAggregator);
        ea.publish('swissdata:online');
      } else if (!response || response.status !== 'OK') {
        throw new Error('Offline');
      }
    }).catch((error) => {
      if (this.state.swissdata.online !== false) {
        this.store.dispatch(setOnline, false);
        let ea = this.container.get(EventAggregator);
        ea.publish('swissdata:offline');
      }
    });
  }

  public startCheckStatus(interval: number, unit: 'milliseconds' | 'seconds' = 'milliseconds') {
    this.stopCheckingStatus();
    if (unit === 'seconds') interval = interval * 1000;
    this.checkStatus();
    this.checkStatusInterval = setInterval(() => {
      this.checkStatus();
    }, interval);
  }
  

  public stopCheckingStatus() {
    clearInterval(this.checkStatusInterval);
  }

  ensureAuthentication(): Promise<boolean> {
    if (!this.swissdataInitDone) throw new Error('SwissdataApi must be initialized (init()) before you can use it');
    if (!this.state.swissdata.authenticated) return Promise.resolve(false);
    return this.post('/auth/authenticated').then((response: any) => {
      if (response.status === 204) {
        return Promise.resolve(true);
      } else {
        return Promise.reject();
      }
    }).catch((error) => {
      return this.setStateAsUnauthenticated();
    }).then(() => {
      return false;
    });
  }

  checkAuthentication(): Promise<boolean> {
    if (!this.swissdataInitDone) throw new Error('SwissdataApi must be initialized (init()) before you can use it');
    if (!this.state.swissdata.authenticated) return Promise.resolve(false);
    return this.post('/auth/authenticated').then((response) => {
      return false;
    });
  }

  authenticate(username: string, password: string): Promise<boolean> {
    if (!this.swissdataInitDone) throw new Error('SwissdataApi must be initialized (init()) before you can use it');
    return this.post('/auth/token', {username: username.toLowerCase(), password: password}).then(jsonify).then((response) => {
      if (!response || !response.token) return false;
      if (response.type === 'access') {
        return this.setAccessToken(response);
      } else if (response.type === 'double-auth') {
        return this.setDoubleAuth(response);
      } else {
        throw new Error('Invalid response');
      }
    }).catch((error) => {
      return this.setStateAsUnauthenticated().then(() => {
        return Promise.reject(error);
      });
    });
  }

  doubleAuth(code: string): Promise<boolean> {
    if (!this.swissdataInitDone) throw new Error('SwissdataApi must be initialized (init()) before you can use it');
    return this.post('/auth/token', {token: this.state.swissdata.doubleAuthValidationToken, code: code}).then(jsonify).then((response) => {
      if (!response || !response.token) return false;
      if (response.type === 'access') {
        return this.setAccessToken(response);
      } else {
        throw new Error('Invalid response');
      }
    }).catch((error) => {
      return this.setStateAsUnauthenticated().then(() => {
        return Promise.reject(error);
      });
    });
  }

  setAccessToken(token: any) {
    return this.store.dispatch(setAccessToken, token.token).then(() => {
      return this.setCurrentUser();
    });
  }

  setCurrentUser() {
    return this.get('/user/current').then(jsonify).then((user) => {
      if (!user) {
        return this.setStateAsUnauthenticated().then(() => false);
      }
      return this.setStateAsAuthenticated(user).then(() => true);
    });
  }

  setDoubleAuth(token: any) {
    return this.store.dispatch(setDoubleAuthValidationToken, token.token).then(() => {
      return this.store.dispatch('waitForDoubleAuth', token.token).then(() => false);
    });
  }

  logout() {
    console.warn('DEPRECATED', 'SwissdataApi.logout() has been replaced by SdLogin.logout()');
    return this.post('/auth/revoke-token', {token: this.state.swissdata.accessToken}).finally(() => {
      return this.setStateAsUnauthenticated();
    }).then(() => {
      let ea = this.container.get(EventAggregator);
      ea.publish('swissdata-logout');
      ea.publish('swissdata:logout');
    });
  }

  requestResetPassword(emailOrMobile: string): Promise<any> {
    return this.post(`/auth/forgot-password`, {
      q: emailOrMobile.toLowerCase()
    }).then(jsonify);
  }

  resetPassword(token, code, newPassword): Promise<any> {
    return this.put(`/auth/reset-password`, {
      token: token,
      code: code,
      newPassword: newPassword
    }).then(jsonify);
  }

  hideOnboarding() {
    return this.put('/user/hide-onboarding').then(jsonify).then((user) => {
      if (!user) {
        return this.setStateAsUnauthenticated().then(() => false);
      }
      return this.setStateAsAuthenticated(user).then(() => user);
    });
  }

  private setStateAsUnauthenticated(): Promise<any> {
    return this.store.dispatch('logout');
  }

  private setStateAsAuthenticated(user: SwissdataUser): Promise<any> {
    return this.store.dispatch('authenticate', user);
  }
}

@inject(Container)
export class AuthorizeStep {

  private container: Container;

  constructor(container?: Container) {
    this.container = container instanceof Container ? container : Container.instance;
  }

  static redirectUnauthenticatedTo: string = 'home';

  public run(navigationInstruction: NavigationInstruction, next) {
    if (navigationInstruction.getAllInstructions().some(i => i.config.settings.auth)) {
      if (!this.container.get(SwissdataApi).state.swissdata.authenticated) {
        let url = AuthorizeStep.redirectUnauthenticatedTo;
        if (url.indexOf('?') !== -1) {
          url += '&';
        } else {
          url += '?';
        }
        const f = navigationInstruction.parentInstruction?.config.name || '';
        const t = navigationInstruction.config.name;
        const p = navigationInstruction.params ? btoa(JSON.stringify(navigationInstruction.params)) : '';
        if (f) {
          url += `f=${f}&`;
        }
        if (p) {
          url += `p=${p}&`;
        }
        url += `t=${t}`;
        return next.cancel(new Redirect(url));
      }
    }
    return next();
  }
}