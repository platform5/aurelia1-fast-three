import { EventAggregator } from 'aurelia-event-aggregator';
import { Aurelia, Container } from 'aurelia-framework';
import { I18N, TCustomAttribute } from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend';

export interface i18NSetupOptions {
  aurelia?: Aurelia;
  host: string;
  apiKey: string;
  translationMemoryApiKey: string;
  translationMemoryHost?: string;
  defaultLanguage: string;
  debug?: boolean;
  saveMissing?: boolean;
  skipTranslationOnMissingKey?: boolean;
}

let _options: i18NSetupOptions = {
  host: '',
  apiKey: '',
  translationMemoryApiKey: '',
  defaultLanguage: ''
};

export function getI18NSetupOptions(): i18NSetupOptions {
  return _options;
}

export let i18nSetup = (options: i18NSetupOptions) => {

  _options = options;

  let saveMissing = options.saveMissing !== undefined ? options.saveMissing : true;
  let skipTranslationOnMissingKey = options.skipTranslationOnMissingKey !== undefined ? options.skipTranslationOnMissingKey : false;
  let debug = options.debug !== undefined ? options.debug : false;
  
  return (instance: I18N) => {
    let aliases = ['t', 'i18n'];
    // add aliases for 't' attribute
    TCustomAttribute.configureAliases(aliases);

    // register backend plugin
    instance.i18next.use(Backend);

    // adapt options to your needs (see http://i18next.com/docs/options/)
    // make sure to return the promise of the setup method, in order to guarantee proper loading
    return instance.setup({
      backend: {                                  // <-- configure backend settings
        loadPath: (lngs: string[], namespaces: string[]) => {
          if (namespaces.includes('languages') || namespaces.includes('countries')) {
            return `/ar-translation/{{ns}}-{{lng}}.json`;
          }
          options.translationMemoryHost = options.translationMemoryHost || options.host;
          const apiKey = namespaces.includes('global') ? options.translationMemoryApiKey : options.apiKey;
          const apiHost = namespaces.includes('global') ? options.translationMemoryHost : options.host;
          return `${apiHost}/dico/backend?locale={{lng}}&apiKey=${apiKey}`; // <-- XHR settings for where to get the files from
        },
        crossDomain: true
      },
      saveMissing: saveMissing,
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        let data = {
          lng: lng,
          ns: ns,
          key: key,
          fallbackValue
        };
        setTimeout(() => {
          // send the event with 250ms delay to ensure API is ready to handle the missing key and send to server
          Container.instance.get(EventAggregator).publish('i18next.missing.key', data);
        }, 250)
      },
      skipTranslationOnMissingKey: skipTranslationOnMissingKey,
      attributes: aliases,
      lng : options.defaultLanguage,
      fallbackLng : options.defaultLanguage,
      ns: ['translation', 'languages', 'countries', 'global'],
      defaultNS: 'translation',
      fallbackNS: 'global',
      // https://aurelia.io/blog/2017/03/17/combining-value-converters-with-i18n-in-aurelia/
      // see the link above for more informations on the interpolation value
      interpolation : {
        format : function (value, format, lng) {
          // IMPORTANT: aurelia must be passed to the i18nSetup method
          // in order for interpolation to work !
          if (!options.aurelia) return value;
          const parts = format.replace(/\\:/g, '%%%%').split(':').map(p => p.replace(/%%%%/g, ':'));
          //  Check if the value converter is registered as a resource
          const vc = options.aurelia.resources.getValueConverter(parts.shift());
    
          return vc ? (vc as any).toView(value, ...parts) : value;
        }
      },
      debug : debug
    });
  }
}
