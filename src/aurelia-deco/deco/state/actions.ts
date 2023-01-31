import { DecoAppState, initState } from './interfaces';
import { getLogger, Logger } from 'aurelia-logging';
import { countries } from 'aurelia-resources';

let log: Logger = getLogger('deco-actions');

export function clearDecoState(state: DecoAppState) {
  const newState = Object.assign({}, state);
  newState.stateVersion = initState.stateVersion;
  newState.country = 'CH';
  newState.countries = ['CH'];
  newState.language = 'fr';
  newState.languages = ['fr'];
  return newState;
}

export function initDecoState(state: DecoAppState) {
  const newState = Object.assign({}, state);
  if (!newState.stateVersion) newState.stateVersion = initState.stateVersion;
  if (!newState.country) newState.country = 'CH';
  if (!newState.countries) newState.countries = ['CH'];
  if (!newState.language) newState.language = 'fr';
  if (!newState.languages) newState.languages = ['fr'];
  return newState;
}

export function setStateVersion(state: DecoAppState, stateVersion: string) {
  const newState = Object.assign({}, state);
  newState.stateVersion = stateVersion;
  return newState;
}

export function setLanguages(state: DecoAppState, languages: Array<string> | null) {
  const newState = Object.assign({}, state);
  if (languages === null) {
    delete newState.languages;
  } else {
    newState.languages = languages;
  }
  return newState;
}

export function setLanguage(state: DecoAppState, language: string | null) {
  const newState = Object.assign({}, state);
  if (language === null) {
    delete newState.language;
  } else {
    newState.language = language;
  }
  return newState;
}

export function setRefLanguage(state: DecoAppState, language: string | null) {
  const newState = Object.assign({}, state);
  if (language === null) {
    delete newState.refLanguage;
  } else {
    newState.refLanguage = language;
  }
  return newState;
}

export function setCountryCode(state: DecoAppState, countryCode: undefined | string) {
  const newState = Object.assign({}, state);
  newState.country = undefined;
  for (let country of countries) {
    if (country.countryCode === countryCode || country.countryCode2 === countryCode) {
      newState.country = country.countryCode2;
    }
  }
  return newState;
}

export function setCountry(state: DecoAppState, countryCode: undefined | string) {
  return setCountryCode(state, countryCode);
}

export function setCountries(state: DecoAppState, countries: Array<string> | null) {
  const newState = Object.assign({}, state);
  if (countries === null) {
    delete newState.countries;
  } else {
    newState.countries = countries;
  }
  return newState;
}