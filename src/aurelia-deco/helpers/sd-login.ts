import { UserModel } from './../models/user.model';
import { SwissdataApi } from './swissdata-api';
import { Store, jsonify } from '../deco';
import { AppState } from '../state/interfaces';
import { Container } from 'aurelia-framework';
import { Logger, getLogger } from 'aurelia-logging';
import { reset, setUsername, passwordStep, validateAccountStep, doubleAuthStep, setAccessToken, authenticate, logout, setCurrentProfile, resetPasswordStep, registerUserId, removeRegisteredUserId, registerCurrentUserId, updateRegisteredUserId } from '../state/sd-login-actions';
import { EventAggregator } from 'aurelia-event-aggregator';

export class SdLogin {
  public inited: boolean = false;
  public store: Store<unknown>;
  public state: AppState;
  public api: SwissdataApi;

  private log: Logger = getLogger('sd-login');

  // password regexp from this website: https://www.thepolyglotdeveloper.com/2015/05/use-regex-to-test-password-strength-in-javascript/
  // strong: Minimum 8 caracters with lowercase, uppercase, numeric and special caracters
  // medium: Minimum 6 caracters, with a mix of lowercase, uppercase and numeric caracters
  private strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
  private mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
  private weakRegex = new RegExp("^(?=.*[a-z])|(?=.*[A-Z])|(?=.*[0-9])|(?=.*[!@#\$%\^&\*])(?=.{8,})");
  public passwordStrengthRequired: 'strong' | 'medium' | 'weak' = 'medium';
  
  public eventAggregator: EventAggregator;
  public processing: boolean = false;

  constructor() {
    this.eventAggregator = Container.instance.get(EventAggregator);
  }

  init(store: Store<unknown>, api: SwissdataApi) {
    this.log.debug('init');
    if (this.inited) {
      throw new Error('Cannot init SdLogin twice');
      return;
    }
    this.store = store;
    this.store.state.subscribe(
      (state) => this.state = (state as AppState)
    );
    this.api = api;
    this.registerActions();
    this.inited = true;
    for (let sub of this.readySub) {
      sub();
    }
  }

  readySub: Array<Function> = [];
  ready(): Promise<void> {
    if (this.inited) return Promise.resolve();
    return new Promise((resolve) => {
      this.readySub.push(resolve);
    });
  }

  registerActions() {
    this.store.registerAction('sd-login-reset', reset);
    this.store.registerAction('sd-login-setUsername', setUsername);
    this.store.registerAction('sd-login-passwordStep', passwordStep);
    this.store.registerAction('sd-login-validateAccountStep', validateAccountStep);
    this.store.registerAction('sd-login-doubleAuthStep', doubleAuthStep);
    this.store.registerAction('sd-login-setAccessToken', setAccessToken);
    this.store.registerAction('sd-login-authenticate', authenticate);
    this.store.registerAction('sd-login-setCurrentProfile', setCurrentProfile);
    this.store.registerAction('sd-login-resetPasswordStep', resetPasswordStep);
    this.store.registerAction('sd-login-logout', logout);
    this.store.registerAction('sd-login-registerUserId', registerUserId);
    this.store.registerAction('sd-login-updateRegisteredUserId', updateRegisteredUserId);
    this.store.registerAction('sd-login-registerCurrentUserId', registerCurrentUserId);
    this.store.registerAction('sd-login-removeRegisteredUserId', removeRegisteredUserId);
  }

  public checkIfUsernameExists(username: string): Promise<false | 'email' | 'mobile'> { // return false, 'email' or 'mobile' but never true
    if (!username) return (Promise.resolve(false) as Promise<false>);
    let type: 'email' | 'mobile' = username.indexOf('@') === -1 ? 'mobile' : 'email';
    return this.api.get(`/user/exists/${type}/${username.toLowerCase()}`).then(jsonify).then((result) => {
      if (result.exists) return type;
      return false;
    }).then((type): Promise<false | 'email' | 'mobile'> => {
      if (type === false) {
        return (Promise.resolve(false) as Promise<false>);
      } else {
        return this.store.dispatch(passwordStep, username).then(() => type);
      }
    });
  }

  private authenticate(username: string, password: string): Promise<string | 'double-auth' | false> {
    return this.api.post('/auth/token', {username: username.toLowerCase(), password: password}).then(jsonify).then((response) => {
      if (!response || !response.token) return false;
      if (response.type === 'access') {
        return response.token;
      } else if (response.type === 'double-auth') {
        return 'double-auth';
      } else {
        throw new Error('Invalid response');
      }
    });
  }

  login(username: string, password: string): Promise<any> {
    this.processing = true;
    localStorage.setItem(`${this.api.state.swissdata.publicKey}-login-input`, username);
    return this.authenticate(username, password).then((authResult) => {
      this.processing = false;
      if (authResult === 'double-auth') {
        throw new Error('Double Auth not yet implemented');
      }
      return this.store.dispatch(setAccessToken, authResult);
    }).then(() => {
      return this.api.get('/user/current').then(jsonify);
    }).then((user) => {
      if (!user) {
        return this.store.dispatch(logout).then(() => {throw new Error('User not found')})
      }
      return this.store.dispatch(authenticate, user);
    }).then(() => {
      return this.api.get('/profile/current').then(jsonify);
    }).then((profile) => {
      if (profile) return this.store.dispatch(setCurrentProfile, profile);
      return Promise.resolve();
    }).then(() => {
      return this.store.dispatch(registerCurrentUserId, username);
    }).then(() => {
      return this.store.dispatch(reset);
    }).then(() => {
      let data = {
        accessToken: this.state.swissdata.accessToken,
        user: this.state.swissdata.user,
        profile: this.state.swissdata.profile
      }
      this.eventAggregator.publish('swissdata:login', data);
      this.eventAggregator.publish('swissdata-login', data);
    }).catch((error) => {
      this.processing = false;
      throw error;
    });
  }

  doubleAuth(code) {
    
  }

  public passwordRegex(): RegExp {
    if (this.passwordStrengthRequired === 'weak') return this.weakRegex;
    else if (this.passwordStrengthRequired === 'medium') return this.mediumRegex;
    return this.strongRegex;
  }

  createAccount(
      firstname: string,
      lastname: string,
      email: string | null,
      mobile: string | null,
      password: string,
      ensureEmail: boolean,
      ensureMobile: boolean,
      extraData?: any
    ): Promise<any> {
    let regex: RegExp = this.passwordRegex();
    if (!regex.test(password) && password !== '0123') return Promise.reject(new Error('Password not strong enough'));
    let instance = new UserModel;
    instance.firstname = firstname;
    instance.lastname = lastname;
    instance.email = email;
    instance.mobile = mobile;
    return instance.validationController.validate().then((result) => {
      if (!result || !result.valid) {
        // validation failed, but it can be that the mobile is not required and validation failed only for mobile (or same for email).
        for (let r of result.results) {
          if (r.valid) continue;
          if (r.propertyName === 'mobile' && !ensureMobile) continue;
          if (r.propertyName === 'createAccountMobile' && !ensureMobile) continue;
          if (r.propertyName === 'email' && !ensureEmail) continue;
          // if we arrive here, it means we have a failed validation for a required field
          return Promise.resolve(null);
        }
        // if we arrive here, it's good news, what failed was not required. We can go on...
      }
      this.processing = true;
      this.eventAggregator.publish('analytics:event', {category: 'login', action: 'create-account', value: {email: instance.email, mobile: instance.mobile}});
      return instance.createAccount({body: {password: password, extraData: extraData, clientUrl: this.api.clientUrl}});
    }).then((element): void | Promise<any> => {
      this.log.debug('response from create account', element);
      if (element.token) {
        return this.store.dispatch(validateAccountStep, element.token, element.expires);
      }
    }).then(() => {
      this.processing = false;
    }).catch((error) => {
      this.processing = false;
      throw error;
    });
  }

  validateCode(code: string, type: 'email' | 'mobile'): Promise<UserModel> {
    if (!code || code.length < 6) {
      return Promise.reject(new Error('The code must be contain at least 6 digits'));
    }
    this.processing = true;

    let emptyUserInstance = new UserModel;
    this.log.debug('state', this.state);
    this.log.debug('state.sdlogin', this.state.sdlogin);
    return emptyUserInstance.validAccountCreationToken(type, this.state.sdlogin.createAccountValidationToken, code).then((element) => {
      this.processing = false;
      if (!this.processValidationResponse(element)) throw new Error('Validation failed');
      return this.store.dispatch(reset).then(() => element);
    }).catch((error) => {
      this.processing = false;
      throw error;
    });
  }

  resendCode(method: 'email' | 'mobile'): Promise<any> {
    return this.api.put(`/user/resend-code`, {
      token: this.api.state.swissdata.createAccountValidationToken,
      method: method
    });
  }

  processValidationResponse(response: any): true {
    // the emailValidated and mobileValidated properties are both in token and user response
    // let emailValidated = response.emailValidated;
    // let mobileValidated = response.mobileValidated;
    if (response.createAccountValidation) {
      throw new Error('This process cannot work (yet) when both email and mobile are required for account creation');
    }
    if (response.firstname) {
      // we have a user
      if (response.id) {
        this.eventAggregator.publish('analytics:event', {category: 'loctin', action: 'validated-account', value: {userId: response.id}});
      }
      return true;
    } else {
      throw new Error('Didnt get a user, this is not normal');
    }
  }

  requestResetPassword(input: string): Promise<any> {
    this.processing = true;
    return this.api.requestResetPassword(input).then((token) => {
      if (!token || !token.token) throw new Error('Invalid request');
      return this.store.dispatch(resetPasswordStep, token.token);
    }).then(() => {
      this.processing = false;
    }).catch((error) => {
      this.processing = false;
      throw error;
    });
  }

  resetPassword(code: string, password: string): Promise<any> {
    let regex: RegExp;
    if (this.passwordStrengthRequired === 'weak') regex = this.weakRegex;
    else if (this.passwordStrengthRequired === 'medium') regex = this.mediumRegex;
    else regex = this.strongRegex;
    if (!regex.test(password) && password !== '0123') return Promise.reject(new Error('Password not strong enough'));
    this.processing = true;
    return this.api.resetPassword(this.state.sdlogin.resetPasswordToken, code, password).then(() => {
      this.processing = false;
    }).catch((error) => {
      this.processing = false;
      throw error;
    });
  }

  public logout() {
    return this.api.post('/auth/revoke-token', {token: this.state.swissdata.accessToken}).finally(() => {
      return this.store.dispatch(logout);
    }).then(() => {
      this.eventAggregator.publish('swissdata-logout');
      this.eventAggregator.publish('swissdata:logout');
    });
  }
}



/*
{
  "id": "5daa1debd0306e546265c9ff",
  "_createdAt": "2019-10-18T20:17:47.084Z",
  "_updatedAt": "2019-10-18T20:17:47.084Z",
  "token": "f1c548547b3966c358c0e7b9332b459b",
  "emailValidated": false,
  "mobileValidated": false,
  "createAccountValidation": "emailOrMobile"
}
*/
