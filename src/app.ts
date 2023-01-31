import { inject, BindingEngine, bindable } from 'aurelia-framework';


export class App {
  public message = 'Hello World!';

  constructor(private element: Element, private bindingEngine: BindingEngine) {
  }

  private clic() : void {

    console.log('clic');

  }
}
