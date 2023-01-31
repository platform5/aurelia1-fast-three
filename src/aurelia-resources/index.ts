// import { SentryHelper } from './helpers/sentry';
import { FrameworkConfiguration, PLATFORM } from 'aurelia-framework';

export interface AureliaResourcesConfig {
  stripe?: {
    apiKey?: string
  };
  sentry?: {
    dsn?: string;
    environment?: string;
    debug?: boolean;
    samplingRate?: number;
  }
}

export function configure(config: FrameworkConfiguration, pluginConfig?: AureliaResourcesConfig) {
  config.container.registerInstance('aurelia-resources-config', pluginConfig || {});
}

/* Expose elements */
export { ArDrawer, ArDrawerToggleAttribute, ArDrawerOpenAttribute, ArDrawerCloseAttribute, onDrawerStatusChanged } from './elements/ar-drawer';
export { ArDrawerTheme } from './elements/ar-drawer-theme';
export * from './elements/ar-notification';

/* Expose helpers */

export { ImageHelpers } from './helpers/image';
export { countries } from './helpers/countries';
export { Analytics, AnalyticEntry } from './helpers/analytics';
export * from './helpers/date';
export * from './helpers/notify';