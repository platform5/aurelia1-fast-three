import {FrameworkConfiguration} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    PLATFORM.moduleName('./login'),
    PLATFORM.moduleName('./user-preview.html'),
    PLATFORM.moduleName('./menu'),
    PLATFORM.moduleName('./qr-code-reader')
  ]);
}
