import { FrameworkConfiguration, PLATFORM } from 'aurelia-framework';
import { ValidationMessageProvider } from 'aurelia-validation';
import { I18N } from 'aurelia-i18n';
export  { Container } from 'aurelia-dependency-injection';
export * from './deco';

export interface AureliaSwissdataConfig {
  api: {
    host: string,
    publicKey: string
  },
  registerMissingTranslationKeys: boolean;
  ipStack?: {
    apiKey?: string
  };
  version?: string;
  clientUrl?: string;
}

let defaultSettings:AureliaSwissdataConfig = {
  api: {
    host: '',
    publicKey: ''
  },
  registerMissingTranslationKeys: true
}

export function configure(config: FrameworkConfiguration, pluginConfig?: AureliaSwissdataConfig) {
  let pConfig = Object.assign({}, defaultSettings, pluginConfig);
  config.container.registerInstance('aurelia-deco-config', pConfig);
  config.globalResources([
  ]);

  // Default Validation messages by key
  // default: "${$displayName} is invalid.",
  // required: "${$displayName} is required.",
  // matches: "${$displayName} is not correctly formatted.",
  // email: "${$displayName} is not a valid email.",
  // minLength: "${$displayName} must be at least ${$config.length} character${$config.length === 1 ? '' : 's'}.",
  // maxLength: "${$displayName} cannot be longer than ${$config.length} character${$config.length === 1 ? '' : 's'}.",
  // minItems: "${$displayName} must contain at least ${$config.count} item${$config.count === 1 ? '' : 's'}.",
  // maxItems: "${$displayName} cannot contain more than ${$config.count} item${$config.count === 1 ? '' : 's'}.",
  // min: "${$displayName} must be at least ${$config.constraint}.",
  // max: "${$displayName} must be at most ${$config.constraint}.",
  // range: "${$displayName} must be between or equal to ${$config.min} and ${$config.max}.",
  // between: "${$displayName} must be between but not equal to ${$config.min} and ${$config.max}.",
  // equals: "${$displayName} must be ${$config.expectedValue}.",

  const i18n = config.container.get(I18N);
  ValidationMessageProvider.prototype.getMessage = function(key) {
    const translation = i18n.tr(`global.validationMessages.${key}`);
    return this.parser.parse(translation);
  };

  ValidationMessageProvider.prototype.getDisplayName = function(propertyName, displayName) {
    if (displayName !== null && displayName !== undefined) {
      return typeof displayName === 'string' ? displayName : displayName();
    }
    return i18n.tr(propertyName.toString());
  };
}

/* Expose models */
export * from './models';
export * from './state';
export * from './decorators';


/* Expose helpers */
export * from './helpers/swissdata-api';
export * from './helpers/request-recorder';
export * from './helpers/profile-helper';
export * from './helpers/analytics';
export * from './helpers/i18n-setup';
export * from './helpers/swissdata-global';
export * from './helpers/sd-login';
