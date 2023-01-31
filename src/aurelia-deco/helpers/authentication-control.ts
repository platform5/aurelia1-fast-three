import { Interceptor } from 'aurelia-fetch-client';
import { Router } from 'aurelia-router';
import { inject } from 'aurelia-framework';
// import { notify } from 'aurelia-resources';
import { Container } from 'aurelia-framework';
import { SwissdataGlobal } from './swissdata-global';

@inject(Router, Container)
export class AuthenticationControl {

  public active: boolean = true;
  public notAuthenticated: () => void = () => {};
  public notAuthenticatedRoute: string = 'login';
  public onlyForAuthRoutes: boolean = false; // if true, the redirect only happens when the route has the settings {auth: true}

  constructor(public router: Router, private container: Container) {
    this.notAuthenticated = async () => {
      await this.router.ensureConfigured();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const sdGlobal = this.container.get('sd-global') as SwissdataGlobal & {logout: () => Promise<any>};
      await sdGlobal.isReady();
      await sdGlobal.logout();
      const instruction = this.router.currentInstruction;
      const isAuthRoute = instruction.config.settings && instruction.config.settings.auth;
      if (!isAuthRoute && this.onlyForAuthRoutes) {
        return;
      }
      const t = instruction.config.name;
      const p = instruction.params ? btoa(JSON.stringify(instruction.params)) : '';
      const params: any = {};
      if (p) {
        params.p = p;
      }
      if (t) {
        params.t = t;
      }
      this.router.navigateToRoute('login', params);
    }
  }

  public responseInterceptor(): Interceptor {

    return {
      request: (req) => {
        return req;
      },
      response: async (res, req) => {
        if (!this.active) { return res; }
        if (res.status === 500) {
          try {
            const json = await res.clone().json();
            const errors = [
              'Token not found',
              'Token has expired'
            ];
            if (json && json.error && errors.includes(json.error) && !req.url.includes('/validate')) {
              // notify('Please login again to continue');
              this.debounceLoginAgainMessage();
              this.notAuthenticated();
            }
          } catch (error) {
            // do nothing (yet)
          }
        }
        return res;
      }
    }
  }

  private debounceTimeout;
  private debounceLoginAgainMessage() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      // notify('Please login again to continue');
    }, 20);
  }

}