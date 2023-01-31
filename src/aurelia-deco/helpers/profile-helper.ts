import { SwissdataApi } from './swissdata-api';
import { ProfileModel } from '../models/profile.model';
import { inject, Container } from 'aurelia-framework';
import { setProfile, clearProfile } from '../state/actions';
import { jsonify } from '../deco';
import { UserModel } from '../models/user.model';

@inject(SwissdataApi)
export class ProfileHelper {

  private static _swissdataApi: SwissdataApi;
  public static profileInstance: ProfileModel;

  static get swissdataApi() {
    if (!ProfileHelper._swissdataApi) {
      ProfileHelper._swissdataApi = Container.instance.get(SwissdataApi);
    }
     
    return ProfileHelper._swissdataApi;

  }

  constructor(private swissdataApi: SwissdataApi) {

  }

  static registerActions() {
    this.swissdataApi.store.registerAction('setProfile', setProfile);
    this.swissdataApi.store.registerAction('clearProfile', clearProfile);
  }

  static getCurrentProfile() {
    return this.swissdataApi.get(`/profile/current`).then(jsonify).then((response) => {
      let instance = new ProfileModel;
      instance.id = response.id;
      instance.updateInstanceFromElement(response);
      this.profileInstance = instance;
      return this.swissdataApi.store.dispatch(setProfile, response);
    });
  }

  static getEditingInstance() {
    let instance = new ProfileModel;
    instance.id = this.swissdataApi.state.swissdata.profile.id;
    instance.updateInstanceFromElement(this.swissdataApi.state.swissdata.profile);
    return instance;
  }

  static getEditingUserInstance() {
    let instance = new UserModel;
    instance.id = this.swissdataApi.state.swissdata.user.id;
    instance.updateInstanceFromElement(this.swissdataApi.state.swissdata.user);
    return instance;
  }

  static clearProfile() {
    return this.swissdataApi.store.dispatch(clearProfile);
  }



}
