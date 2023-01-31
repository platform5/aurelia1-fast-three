import { AnalyticsModel } from './../models/analytics.model';
import { Analytics as AnalyticsBase } from 'aurelia-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Container } from 'aurelia-framework';
import { Logger, getLogger } from 'aurelia-logging';

let log: Logger = getLogger('swissdata:analytics');

export class Analytics extends AnalyticsBase {

  public autoSave: boolean = false;

  public setListeners() {
    super.setListeners();
    let ea: EventAggregator = Container.instance.get(EventAggregator);
    ea.subscribe('analytics:save', (data: Array<any>) => {
      if (!this.autoSave) return;
      this.publishToApi(data);
    });
  }

  private publishToApi(data: Array<any>) {
    for (let row of data) {
      let entry = new AnalyticsModel();
      entry.updateInstanceFromElement(row).then(() => {
        entry.save();
      });
    }
  }
}