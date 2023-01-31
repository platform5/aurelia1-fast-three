import { ProfileModel } from './../models/profile.model';
import { UserModel } from './../models/user.model';
import { SdLogin } from './sd-login';
import { DynamicConfigModel } from './../models/dynamicconfig.model';
import { SwissdataInitOptions, AureliaSwissdataConfig } from '../index';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { SwissdataApi } from './swissdata-api';
import { Container } from 'aurelia-dependency-injection';
//import { errorHandler } from '../components/notification/swissdata-notification';
import { getLogger, Logger } from 'aurelia-logging';
import { DynamicDataModel } from '../models/dynamicdata.model';
import { Store, IpStackResponse, IpStack, EnsureModel, Model } from '../deco';
import { logMiddleware, LogLevel, MiddlewarePlacement, localStorageMiddleware, rehydrateFromLocalStorage } from 'aurelia-store';
import { setAppModels, setCurrentRoute } from '../state/actions';
import { AppState } from '../state/interfaces';
import { map } from 'rxjs/operators';
// import { errorify, SentryHelper } from 'aurelia-resources';
import moment from 'moment';

export interface BootstrapConfig {
  container?: Container;
  enableStateLog?: boolean;
  enableStateStorage?: boolean;
  localStorageMiddleware?: (state: unknown, _: unknown, settings?: {
    key: string;
  }) => void;
  stateStorageKey?: string;
  enableRestoringRouteFromState?: boolean;
  restoreRouteFromStateOnlyFor?: Array<string>;
  enableStateVersionning?: boolean;
  stateVersion?: string;
  initialState?: any;
  useDynamicModels?: boolean;
  enableIpStackAutoDetect?: boolean;
  dynamicModelSlugsForAutoLoading?: Array<string>;
  language?: string;
  languages?: Array<string>;
  country?: string;
  countries?: Array<string>;
}

export class SwissdataGlobal {

  public eventAggregator: EventAggregator;
  public router: Router;
  public i18n: I18N;
  public swissdataApi: SwissdataApi;
  public ready: boolean = false;
  public log: Logger;

  public state: AppState;
  public sdLogin: SdLogin;

  // public sentry: SentryHelper;

  public ipStackResponse?: IpStackResponse;
  public config: BootstrapConfig;

  private stateSubscription: any;
  private stateLanguageSubscription: any;

  public container: Container;
  public ensureUsers: EnsureModel<typeof UserModel>;
  public ensureProfiles: EnsureModel<typeof ProfileModel>;

  constructor() {
    this.log = getLogger('app');
  }

  // Before calling bootstrap, the 
  // inherited global must register an action called
  // initAppState
  // store.registerAction('initAppState', initAppState);
  // idem for 'setFullState' and 'clearState'
  public bootstrap(config: BootstrapConfig): Promise<any> {
    this.log.info('Boostrap');
    this.container = config.container instanceof Container ? config.container : Container.instance;
    this.container.registerInstance('sd-global', this);
    this.eventAggregator = this.container.get(EventAggregator);
    this.router = this.container.get(Router);
    this.i18n = this.container.get(I18N);
    this.swissdataApi = this.container.get(SwissdataApi);
    this.sdLogin = this.container.get(SdLogin);
    // this.sentry = this.container.get(SentryHelper);

    this.subscribe('swissdata-login', () => {
      this.debug('Received login event');
      // this.sentry.setUser({id: this.state.swissdata.user?.id});
      this.onLogin();
    });

    this.subscribe('swissdata-logout', () => {
      this.debug('Received logout event');
      // this.sentry.unsetUser();
      this.onLogout();
    });

    this.ensureUsers = this.container.get(EnsureModel) as EnsureModel<typeof UserModel>;
    this.ensureUsers.init(UserModel, '&autoFetch=profile', {route: '/search-user'});
    this.ensureProfiles = this.container.get(EnsureModel) as EnsureModel<typeof ProfileModel>;
    this.ensureProfiles.init(ProfileModel);
    if (config.enableStateLog === undefined) config.enableStateLog = false;
    if (config.enableStateStorage === undefined) config.enableStateStorage = true;
    if (!config.stateStorageKey) config.stateStorageKey = 'app-state';
    if (!config.enableStateVersionning) config.enableStateVersionning = true;
    if (config.enableStateVersionning && (!config.stateVersion || !config.initialState)) {
      throw new Error('You must provide `stateVersion` and `initialState` in order to use the state versionning');
    }
    if (config.enableRestoringRouteFromState === undefined) config.enableRestoringRouteFromState = false;
    if (config.restoreRouteFromStateOnlyFor === undefined) config.restoreRouteFromStateOnlyFor = [];
    if (config.useDynamicModels === undefined) config.useDynamicModels = true;
    if (config.enableIpStackAutoDetect === undefined) config.enableIpStackAutoDetect = false;
    if (config.dynamicModelSlugsForAutoLoading === undefined) config.dynamicModelSlugsForAutoLoading = [];
    this.config = config;
    let store: Store<unknown> = this.container.get(Store);
    if (!store.isActionRegistered('setFullState')) throw new Error('An action called `setFullState` must be registered in the store');
    if (!store.isActionRegistered('initAppState')) throw new Error('An action called `initAppState` must be registered in the store');
    // if (!store.isActionRegistered('clearState')) throw new Error('An action called `clearState` must be registered in the store');
    return this.start().then(() => {
      if (config.enableRestoringRouteFromState) this.listenToRouteAndSaveInState();
      if (config.enableStateLog) store.registerMiddleware(logMiddleware, MiddlewarePlacement.After, { logType: LogLevel.debug });

      if (config.enableStateStorage) {
        store.registerMiddleware(config.localStorageMiddleware || localStorageMiddleware, MiddlewarePlacement.After, { key: config.stateStorageKey })
        store.registerAction('Rehydrate', rehydrateFromLocalStorage);
        this.container.registerAlias(Store, 'aurelia-store');
        return store.dispatch(rehydrateFromLocalStorage, config.stateStorageKey);
      } else {
        return Promise.resolve();
      }
    }).then(() => {
      this.stateSubscription = store.state.subscribe(
        (state: AppState) => {
          this.state = state
        }
      );
      const pluckOperator = map(x => `language`) as any;
      this.stateLanguageSubscription = store.state.pipe(pluckOperator).subscribe((state: any) => {
        if (typeof state === 'string' && state.length === 2 && state !== this.i18n.getLocale()) {
          this.i18n.setLocale(state);
        }
      });
      if (!this.config.enableStateVersionning) return Promise.resolve();
      this.info('State Version', this.state.stateVersion);
      let sdConfig: AureliaSwissdataConfig = this.container.get('aurelia-deco-config');
      let resetState = false;
      if (this.state.stateVersion !== config.stateVersion) {
        this.warn('Reset state because version is different');
        resetState = true;
      } else if (this.state.swissdata.h !== btoa(sdConfig.api.host)) {
        this.warn('Reset state because host is different');
        resetState = true;
      }
      if (resetState) {
        return store.dispatch('setFullState', config.initialState);
      } else {
        return Promise.resolve();
      }
    }).then(() => {
      return store.dispatch('initAppState');
    }).then(() => {
      if (config.enableIpStackAutoDetect && !this.state.country) {
        this.log.info('Auto detect country');
        // async operation
        IpStack.autoDetect().then((result) => {
          store.dispatch('setCountryCode', result.country_code);
          this.ipStackResponse = result;
        });
      }
      this.info('Init Swissdata');
      let initOptions: SwissdataInitOptions = {};
      if (config.language) {
        initOptions.language = this.state.language || config.language;
      }
      if (config.languages) {
        initOptions.languages = config.languages;
      }
      if (config.country) {
        initOptions.country = config.country;
      }
      if (config.countries) {
        initOptions.countries = config.countries;
      }
      return this.swissdataApi.init((store as any), initOptions);
    }).then(() => {
      return this.sdLogin.init(this.container.get(Store), this.swissdataApi);
    }).then(() => {
      this.info('Wait for Swissdata to be ready');
      return this.swissdataApi.isReady();
    }).then(() => {
      return this.beforeEnsuringAuthentication();
    }).then(() => {
      this.info('Ensure authentication');
      return this.swissdataApi.ensureAuthentication();
    }).then((): Promise<any> => {
      return this.afterEnsuringAuthentication();
    }).then((): Promise<any> => {
      this.registerActions();
      if (this.state.swissdata.authenticated) {
        return this.onAuthenticatedLoad();
      } else {
        return this.onUnauthenticatedLoad();
      }
    }).then((): Promise<any> => {
      return Promise.resolve();
    }).then(() => {
      this.info('End of bootstrap');
      // this.ready = true; // we leave the responsibility of setting the ready flag to the real application using swissdata global

      // regarding the restoreRouteFromState
      // we tend to have views that only display the router once the user is logged in
      // when this is the case, we must still check if the following work ??
      // it could be that this can only be ran once the router is part of the DOM???
      // if (this.state.swissdata.authenticated && config.enableRestoringRouteFromState) {
      //   return this.restoreRouteFromState(this.state);
      // } else {
      //   return Promise.resolve();
      // }
      if (this.state.swissdata.authenticated && config.enableRestoringRouteFromState) {
        this.restoreRouteFromState(this.state, this.config.restoreRouteFromStateOnlyFor);
      }
      return Promise.resolve();
    });
  }

  public start(): Promise<any> {
    // overwrite this method in global.ts to do some work in starting the app
    return Promise.resolve();
  }

  public beforeEnsuringAuthentication(): Promise<any> {
    // overwrite this method in global.ts to do some work before to ensure authentication
    return Promise.resolve();
  }

  public afterEnsuringAuthentication(): Promise<any> {
    // overwrite this method in global.ts to do some work before to ensure authentication
    return Promise.resolve();
  }

  public onAnyLoad(): Promise<any> {
    // overwrite or enhance this method in global.ts to do some work while loading authenticated or unauthenticated users
    if (this.config.useDynamicModels) {
      return DynamicConfigModel.getAll().then((elements): Promise<any> => {
        for (let instance of elements) {
          DynamicDataModel.registerModel((instance as DynamicConfigModel));
        }
        if (this.config.dynamicModelSlugsForAutoLoading && this.config.dynamicModelSlugsForAutoLoading.length) {
          return this.updateAllModelsFromApi(true);
        } else {
          return Promise.resolve();
        }
      });
    }
    return Promise.resolve();
  }

  public onAuthenticatedLoad() {
    // overwrite or enhance this method in global.ts to do some work while loading authenticated user
    // don't forget to call onAnyLoad inside your overwrite
    this.info('Authenticated Load');
    return this.onAnyLoad();
  }

  public onUnauthenticatedLoad() {
    // overwrite or enhance this method in global.ts to do some work while loading unauthenticated user
    // don't forget to call onAnyLoad inside your overwrite
    this.info('Unauthenticated Load');
    return this.onAnyLoad();
  }

  public onLogin(): Promise<any> {
    // overwrite or enhance this method in global.ts to do some work on login
    return this.onAuthenticatedLoad();
  }

  public onLogout(): Promise<any> {
    // overwrite or enhance this method in global.ts to do some work on logout
    return Promise.resolve();
  }

  public isReady(): Promise<void> {
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
        reject(new Error('Application not ready after 5 seconds [timeout]'));
      }, 5000);
    });
  }

  public registerActions() {
    let store: Store<unknown> = this.container.get(Store);
    store.registerAction('setAppModels', setAppModels);
  }

  public publish(event: any, data?: any) {
    return this.eventAggregator.publish(event, data);
  }

  public subscribe(event: any, callback: Function) {
    return this.eventAggregator.subscribe(event, callback);
  }

  public subscribeOnce(event: any, callback: Function) {
    return this.eventAggregator.subscribeOnce(event, callback);
  }

  public navigateToRoute(route: string, params?: any, options?: any) {
    return this.router.navigateToRoute(route, params, options);
  }

  public navigate(fragment: string, options?: any) {
    return this.router.navigate(fragment, options);
  }

  public getLocale() {
    return this.i18n.getLocale();
  }

  public popError(event) {
    if (event && typeof event === 'object' && event.detail && event.detail.error) {
      //errorHandler('main', {lifetime: 15000, hideOnClick: true})(event.detail.error);
      // errorify(event.detail.error, {timeout: 15000});
    }
  }

  public info(message: string, ...rest) {
    this.log.info(message, ...rest);
  }

  public debug(message: string, ...rest) {
    this.log.debug(message, ...rest);
  }

  public error(message: string, ...rest) {
    this.log.error(message, ...rest);
  }

  public warn(message: string, ...rest) {
    this.log.warn(message, ...rest);
  }

  public listenToRouteAndSaveInState() {
    let store: Store<unknown> = this.container.get(Store);
    store.registerAction('setCurrentRoute', setCurrentRoute);
    this.subscribe('router:navigation:success', (event) => {
      store.dispatch(setCurrentRoute, event.instruction);
    });
  }

  public restoreRouteFromState(state: AppState, onlyOnSpecificRouteNames: Array<string> = []): Promise<any> {
    this.info('Restore Route From State'); 
    return this.router.ensureConfigured().then((): Promise<any> => {
      return new Promise((resolve) => {
        let stateCurrentRoute = Object.assign({}, state.currentRoute);
        if (!stateCurrentRoute || !stateCurrentRoute.name) return resolve(null);
        this.getCurrentRouteASAP().then((currentRouteName) => {
          if (currentRouteName && onlyOnSpecificRouteNames.length && onlyOnSpecificRouteNames.indexOf(currentRouteName) === -1) {
            resolve(null);
          } else if (stateCurrentRoute.name) {
            let params = stateCurrentRoute.params || {};
            this.router.navigateToRoute(stateCurrentRoute.name, params)
            resolve(null);
          }
        });
      });
    }).catch((error) => {
      this.log.warn('error in restoreRouteFromState');
      this.log.error(error);
      return;
    });
  }

  private getCurrentRouteASAP(): Promise<string> {
    return new Promise((resolve) => {
      let routerReady = () => {
        return this.router.currentInstruction && this.router.currentInstruction.config;
      }
      if (routerReady()) return resolve(this.router.currentInstruction.config.name);
      let nbChecks = 0;
      let interval = setInterval(() => {
        if (routerReady()) {
          clearInterval(interval);
          resolve(this.router.currentInstruction.config.name);
        }
        if (nbChecks > 100) {
          clearInterval(interval);
          resolve('');
        }
      }, 5)
    })
  }

  public imageSrc(modelRoute: 'string', fieldname: 'string', previewFormat: string | null = null) {
    let preview = previewFormat ? `&preview=${previewFormat}` : '';
    let config: AureliaSwissdataConfig = this.container.get('aurelia-deco-config');
    return `${config.api.host}/${modelRoute}?apiKey=${this.swissdataApi.state.swissdata.publicKey}&download=${fieldname}${preview}`
  }

  public updateAllModelsFromApi(ignoreError: boolean = false): Promise<any> {
    let promises: Array<Promise<any>> = [];
    for (let modelName of this.config.dynamicModelSlugsForAutoLoading || []) {
      let promise = this.updateModelsFromApi(modelName, ignoreError);
      promises.push(promise);
    }
    return Promise.all(promises).then(() => {
      this.publish('swissdata:all-models-updated-from-api');
    });
  }

  public updateModelsFromApi(modelName: string, ignoreError: boolean = false): Promise<any> {
    let store: Store<unknown> = this.container.get(Store);
    store.registerAction('setAppModels', setAppModels);
    return DynamicDataModel.use(modelName).getAll().then((el) => {
      let elements: Array<DynamicDataModel> = (el as Array<DynamicDataModel>);
      return store.dispatch(setAppModels, modelName, elements);
    }).then(() => {
      this.publish('swissdata:model-updated-from-api', modelName);
    }).catch((error) => {
      if (!ignoreError) throw error;
    });
  }

  public async lastUpdateText(instance: Model): Promise<string> {
    const date = instance._updatedAt ? moment(instance._updatedAt).format() : this.i18n.tr('global.Unknown');
    const _user = instance._updatedBy ? (await this.ensureUsers.get(instance._updatedBy)) : undefined;
    const user: string = _user ? _user._label : this.i18n.tr('global.Unknown');
    // return this.i18n.tr('Last update by {{user}} on {{- date}}', {user, date});
    return this.i18n.tr('Last update by {{user}} on {{- date}}');
  }


}