import { AureliaSwissdataConfig } from './../../index';
import http from 'http';
import { Container } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

export interface IpStackLanguage {
  code: string;
  name: string;
  native: string;
}

export interface IpStackError {
  code: number;
  type: string;
  info: string;
}

export interface IpStackLocation {
  geoname_id: null | string,
  capital: string;
  languages: Array<IpStackLanguage>;
  country_flag: string;
  country_flag_emoji: string;
  country_flag_emoji_unicode: string;
  calling_code: string;
  is_eu: boolean;
}

export interface IpStackResponse {
  ip: string;
  type: 'ipv4' | 'ipv6';
  continent_code: string;
  continent_name: string;
  country_code: string;
  country_name: string;
  region_code: string;
  region_name: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  location: IpStackLocation;
  error?: IpStackError
}

export class IpStack {

  private static getApiKey(): string {
    let config: AureliaSwissdataConfig = Container.instance.get('aurelia-deco-config');
    if (config && config.ipStack && config.ipStack.apiKey) return config.ipStack.apiKey;
    return '';
  }

  static autoDetect(apiKey?: string): Promise<IpStackResponse> {
    if (!apiKey) apiKey = IpStack.getApiKey();
    if (!apiKey) throw new Error('Missing ipstack api key');
    return IpStack.requester(apiKey);
  }

  static standard(ip: string, apiKey: string): Promise<IpStackResponse> {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: 'api.ipstack.com',
        port: 80,
        path: `/${ip}?access_key=${apiKey}`,
        agent: false  
      }, (res) => {
        let body = ""
        res.on('data', data => {
          body +=data
        });
        res.on('end', () => {
          let parsedBody = (JSON.parse(body) as IpStackResponse);
          let {error} = parsedBody
          if(error !== undefined){
            reject(new Error(error.info));
          } else {
            Container.instance.get(EventAggregator).publish('ipstack:standard', parsedBody);
            resolve(parsedBody);
          }
        });
        res.on('error', err => {
          reject(err);
        });
      });
    });
  }

  static requester(apiKey: string): Promise<IpStackResponse> {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: 'api.ipstack.com',
        port: 80,
        path: `/check?access_key=${apiKey}`,
        agent: false  
      }, (res) => {
        let body = ""
        res.on('data', data => {
          body +=data
        });
        res.on('end', () => {
          let parsedBody = (JSON.parse(body) as IpStackResponse);
          let {error} = parsedBody
          if(error !== undefined){
            reject(new Error(error.info));
          } else {
            Container.instance.get(EventAggregator).publish('ipstack:requester', parsedBody);
            resolve(parsedBody);
          }
        });
        res.on('error', err => {
          reject(err);
        });
      });
    });
  }
}


