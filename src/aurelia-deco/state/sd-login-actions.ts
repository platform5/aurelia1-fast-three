import { ProfileModel } from './../models/profile.model';
import { AppState, SwissdataUser } from './interfaces';
import { getLogger, Logger } from 'aurelia-logging';

let log: Logger = getLogger('sd-login-actions');

export function reset(state: AppState) {
  const newState = Object.assign({}, state);
  if (newState.sdlogin && newState.sdlogin.username) delete newState.sdlogin.username;
  if (newState.sdlogin && newState.sdlogin.createAccountValidationToken) delete newState.sdlogin.createAccountValidationToken;
  if (newState.sdlogin && newState.sdlogin.requireDoubleAuthValidation) delete newState.sdlogin.requireDoubleAuthValidation;
  if (newState.sdlogin && newState.sdlogin.doubleAuthValidationToken) delete newState.sdlogin.doubleAuthValidationToken;
  return newState;
}

export function setUsername(state: AppState, username: string) {
  const newState = Object.assign({}, state);
  if (!newState.sdlogin) newState.sdlogin = {};
  newState.sdlogin.username = username
  return newState;
}

export function passwordStep(state: AppState, username: string) {
  const newState = Object.assign({}, state);
  if (!newState.sdlogin) newState.sdlogin = {};
  newState.sdlogin.username = username
  return newState;
}

export function validateAccountStep(state: AppState, token: string, tokenExpiry?: string) {
  const newState = Object.assign({}, state);
  newState.sdlogin.createAccountValidationToken = token;
  newState.sdlogin.createAccountValidationTokenExpiry = tokenExpiry;
  return newState;
}

export function doubleAuthStep(state: AppState, token: string) {
  const newState = Object.assign({}, state);
  newState.sdlogin.doubleAuthValidationToken = token;
  newState.sdlogin.requireDoubleAuthValidation = true;
  return newState;
}

export function setAccessToken(state: AppState, accessToken: string) {
  const newState = Object.assign({}, state);
  newState.swissdata.accessToken = accessToken;
  newState.swissdata.requireDoubleAuthValidation = false;
  return newState;
}

export function authenticate(state: AppState, user: SwissdataUser, accessToken?: string, profile?: ProfileModel) {
  const newState = Object.assign({}, state);
  newState.swissdata.authenticated = true;
  newState.swissdata.user = user;
  newState.sdlogin.doubleAuthValidationToken = '';
  newState.swissdata.requireDoubleAuthValidation = false;
  if (accessToken) newState.swissdata.accessToken = accessToken;
  if (profile) newState.swissdata.profile = profile;
  return newState;
}

export function setCurrentProfile(state: AppState, profile: ProfileModel) {
  const newState = Object.assign({}, state);
  newState.swissdata.profile = profile;
  return newState;
}

export function resetPasswordStep(state: AppState, token: string) {
  const newState = Object.assign({}, state);
  newState.sdlogin.resetPasswordToken = token;
  return newState;
}

export function logout(state: AppState) {
  const newState = Object.assign({}, state);
  newState.swissdata.authenticated = false;
  newState.swissdata.user = null;
  newState.sdlogin.doubleAuthValidationToken = '';
  newState.swissdata.requireDoubleAuthValidation = false;
  newState.swissdata.accessToken = null;
  newState.swissdata.profile = null;
  return newState;
}

export function registerUserId(state: AppState, userId: string, firstname: string, lastname: string, username: string, profileUrl: string) {
  const newState = Object.assign({}, state);
  if (!newState.sdlogin.accounts) newState.sdlogin.accounts = [];
  let index = newState.sdlogin.accounts.map(i => i.userId).indexOf(userId);
  if (index !== -1) {
    newState.sdlogin.accounts.splice(index, 1);
  }
  newState.sdlogin.accounts.unshift({
    firstname: firstname,
    lastname: lastname,
    username: username,
    userId: userId,
    profileUrl: profileUrl,
  });
  return newState;
}

export function updateRegisteredUserId(state: AppState, userId: string, firstname: string | undefined, lastname: string | undefined, username: string | undefined, profileUrl: string | undefined) {
  const newState = Object.assign({}, state);
  if (newState.sdlogin.accounts) return newState;
  let index = newState.sdlogin.accounts.map(i => i.userId).indexOf(userId);
  if (index !== -1) {
    if (firstname !== undefined) newState.sdlogin.accounts[index].firstname = firstname;
    if (lastname !== undefined) newState.sdlogin.accounts[index].lastname = lastname;
    if (username !== undefined) newState.sdlogin.accounts[index].username = username;
    if (profileUrl !== undefined) newState.sdlogin.accounts[index].profileUrl = profileUrl;
  }
  return newState;
}

export function registerCurrentUserId(state: AppState, username: string) {
  if (!state.swissdata.authenticated || !state.swissdata.user || !state.swissdata.user.id) return state;
  const profileUrl = state.swissdata.profile && state.swissdata.profile.id && state.swissdata.profile.picture ?
        `/profile/${state.swissdata.profile.id}?download=picture` : undefined;

  return registerUserId(state, 
    state.swissdata.user.id,
    state.swissdata.user.firstname,
    state.swissdata.user.lastname,
    username,
    profileUrl,
    );
}

export function removeRegisteredUserId(state: AppState, userId: string) {
  const newState = Object.assign({}, state);
  if (!newState.sdlogin.accounts) newState.sdlogin.accounts = [];
  let index = newState.sdlogin.accounts.map(i => i.userId).indexOf(userId);
  if (index !== -1) {
    newState.sdlogin.accounts.splice(index, 1);
  }
  return newState;
}