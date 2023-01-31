import { AppState, SwissdataState, SwissdataUser, Steps } from './interfaces';
import { getLogger, Logger } from 'aurelia-logging';
import { DynamicDataModel } from '../models/dynamicdata.model';
import { NavigationInstruction } from 'aurelia-router';
import { ProfileModel } from '../models';

let log: Logger = getLogger('swissdata-actions');

export function clearSwissdataState(state: AppState) {
  const newState = Object.assign({}, state);
  newState.swissdata = {
    publicKey: '',
    authenticated: false,
    loginStep: 'login',
    h: ''
  };
  newState.swissdata.publicKey = '';
  newState.swissdata.authenticated = false;
  return newState;
}

export function initSwissdataState(state: AppState) {
  const newState = Object.assign({}, state);
  if (!newState.swissdata) newState.swissdata = {
    publicKey: '',
    authenticated: false,
    loginStep: 'login',
    h: ''
  };
  if (!newState.swissdata.publicKey || typeof newState.swissdata.publicKey !== 'string') newState.swissdata.publicKey = '';
  if (newState.swissdata.authenticated === undefined || typeof newState.swissdata.authenticated !== 'boolean') newState.swissdata.authenticated = false;
  return newState;
}

export function setApiHost(state: AppState, host: string) {
  const newState = Object.assign({}, state);
  newState.swissdata.h = btoa(host);
  return newState;
}

export function setState(state: AppState, swissDataState: SwissdataState) {
  const newState = Object.assign({}, state);
  newState.swissdata = swissDataState;
  return newState;
}

export function setAccessToken(state: AppState, accessToken: string) {
  const newState = Object.assign({}, state);
  newState.swissdata.accessToken = accessToken;
  newState.swissdata.requireDoubleAuthValidation = false;
  return newState;
}

export function setDoubleAuthValidationToken(state: AppState, token: string) {
  const newState = Object.assign({}, state);
  newState.swissdata.doubleAuthValidationToken = token;
  newState.swissdata.requireDoubleAuthValidation = true;
  return newState;
}

export function authenticate(state: AppState, user: SwissdataUser, accessToken?: string, profile?: ProfileModel) {
  const newState = Object.assign({}, state);
  newState.swissdata.authenticated = true;
  newState.swissdata.user = user;
  newState.swissdata.loginStep = 'login';
  newState.swissdata.doubleAuthValidationToken = '';
  if (accessToken) newState.swissdata.accessToken = accessToken;
  if (profile) newState.swissdata.profile = profile;
  return newState;
}

export function waitForDoubleAuth(state: AppState, doubleAuthValidationToken: string) {
  const newState = Object.assign({}, state);
  newState.swissdata.authenticated = false;
  newState.swissdata.loginStep = 'double-auth';
  newState.swissdata.requireDoubleAuthValidation = true;
  newState.swissdata.doubleAuthValidationToken = doubleAuthValidationToken;
  newState.swissdata.accessToken = '';
  return newState;
}

export function logout(state: AppState): AppState {
  const newState = Object.assign({}, state);
  newState.swissdata.authenticated = false;
  newState.swissdata.user = undefined;
  newState.swissdata.accessToken = '';
  newState.swissdata.loginStep = 'login';
  newState.swissdata.requireDoubleAuthValidation = false;
  newState.swissdata.doubleAuthValidationToken = '';
  newState.swissdata.profile = undefined;
  return newState;
}

export function setLoginStep(state: AppState, step: Steps) {
  const newState = Object.assign({}, state);
  newState.swissdata.loginStep = step;
  return newState;
}

export function setSwissdataStateProps(state: AppState, keyValues: {[key: string]: any}) {
  if (keyValues.newAccountInstance) {
    keyValues.newAccountInstance = {
      firstname: keyValues.newAccountInstance.firstname,
      lastname: keyValues.newAccountInstance.lastname,
      email: keyValues.newAccountInstance.email,
      mobile: keyValues.newAccountInstance.mobile,
    }
  }

  const newState = Object.assign({}, state);
  try {
    for (let key in keyValues) {
      newState.swissdata[key] = keyValues[key];
    }
  } catch (error) {
    this.log.warn('Error when setting swissdata stat prop');
    this.log.error(error);
  }
  return newState;
}

export function setAppModels(state: AppState, prop: string, models: Array<DynamicDataModel>) {
  const newState = Object.assign({}, state);
  if (!newState[prop] || !Array.isArray(newState[prop])) return newState;
  newState[prop] = models;
  return newState;
}

export interface CurrentRoute {
  name: string;
  params?: {[key: string]: any};
}

export function setCurrentRoute(state: AppState, instruction: NavigationInstruction) {
  const newState = Object.assign({}, state);
  if (instruction.config && instruction.config.name) {
    newState.currentRoute.name = instruction.config.name;
  }
  if (instruction.params) {
    newState.currentRoute.params = instruction.params;
  } else {
    delete newState.currentRoute.params;
  }
  return newState;
}

export function setOnline(state: AppState, online: 'unkown' | boolean) {
  const newState = Object.assign({}, state);
  newState.swissdata.online = online;
  return newState;
}

export function setProfile(state: AppState, profile: ProfileModel) {
  const newState = Object.assign({}, state);
  newState.swissdata.profile = profile;
  return newState;
}

export function clearProfile(state: AppState) {
  if (!state.profile) return state;
  const newState = Object.assign({}, state);
  delete newState.swissdata.profile;
  return newState;
}
