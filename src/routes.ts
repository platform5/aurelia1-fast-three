import {PLATFORM} from 'aurelia-pal';
import {RouteConfig} from 'aurelia-router';

export let routes: Array<RouteConfig> = [
  { route: '',       name: 'home',       moduleId: PLATFORM.moduleName('pages/home') },
  { route: 'home',       name: 'start',       moduleId: PLATFORM.moduleName('pages/home') }
 ];

export default routes;
