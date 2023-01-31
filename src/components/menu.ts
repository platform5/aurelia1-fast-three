import { Global } from '../global';
import { inject } from 'aurelia-framework';
import { UxModalService } from '@aurelia-ux/modal';

@inject(Global, UxModalService)
export class Menu {
  public constructor(private global: Global, private modalService: UxModalService) {

  }

  public logout(): void {
    this.modalService.cancel();
    this.global.logout();
  }

  public gotoRoute(route, params?, replace = false): void {
    this.modalService.cancel();
    this.global.navigateToRoute(route, params, {replace});
  }


}
