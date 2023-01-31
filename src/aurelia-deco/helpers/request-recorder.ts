import { Interceptor } from 'aurelia-fetch-client';

export interface ExtendedRequest extends Request {
  _jsonBody?: any;
  _maxCaptureIndex?: number;
}

export class RequestRecorder {

  public recording: boolean = false;
  public requests: Array<RecordedRequest> = [];
  public idByVar: {
    [key: string]: string
  } = {};
  public varById: {
    [key: string]: string
  } = {};

  public host: string;

  public keepRequestCallback: (request: RecordedRequest) => boolean = () => true;
  public expectPropertyCallback: (expect: ExpectProperty) => void = () => {};
  public headerCallback: (headerName: string, headerValue: string) => string | null = (_headerName, headerValue) => { return headerValue};

  public requestInterceptor(): Interceptor {

    return {
      request: (req) => {
        if (!this.recording) { return req; }
        const extendedRequest: ExtendedRequest = req;
        extendedRequest._maxCaptureIndex = Object.keys(this.idByVar).length - 1;
        if (req.method === 'POST' || req.method === 'PUT') {
          try {
            extendedRequest.clone().json().then((jsonBody) => {
              extendedRequest._jsonBody = jsonBody;
            });
          } catch (e) {
            // do nothing
          }
        }
        return req;
      },
      response: (res, req) => {
        if (!this.recording) { return res; }
        const extendedRequest: ExtendedRequest = req;
        let currentRequest = new RecordedRequest();
        currentRequest.maxCaptureIndex = extendedRequest._maxCaptureIndex || 0;
        currentRequest.rawUrl = req.url;
        currentRequest.testUrl = req.url.replace(this.host, '');
        currentRequest.method = req.method;
        req.headers.forEach((val, key) => {if (typeof key === 'string') currentRequest.rawHeaders[key] = val});

        let testBody: string = '';
        if (extendedRequest._jsonBody) {
          currentRequest.rawBody = extendedRequest._jsonBody;
          testBody = currentRequest.rawBody ? JSON.stringify(currentRequest.rawBody) : '';
        }

        for (let varName in this.idByVar) {
          const reg: RegExp = new RegExp(this.idByVar[varName], 'gm');
          currentRequest.testUrl = currentRequest.testUrl.replace(reg, `{{ ${varName} }}`);
          if (testBody) testBody = testBody.replace(reg, `{{ ${varName} }}`);
        }

        if (testBody) currentRequest.testBody = JSON.parse(testBody);

        let currentResponse = new RecordedResponse();
        currentResponse.statusCode = res.status;
        currentResponse.statusText = res.statusText;
        res.headers.forEach((val, key) => {if (typeof key === 'string') currentResponse.headers[key] = val});
        currentRequest.response = currentResponse;
        if (res.status !== 201 && currentResponse.headers['content-type'] && currentResponse.headers['content-type'].indexOf('application/json') !== -1) {
          res.clone().json().then((value) => {
            currentResponse.data = value;
            currentRequest.captures[`"$"`] = `"response"`;
            if (Array.isArray(value)) {
              currentResponse.type = 'array';
              for (let index = 0; index < value.length; index++) {
                const item = value[index];
                if (item.id && !this.varById[item.id]) {
                  const varName = `capture_${Object.keys(this.idByVar).length}`;
                  this.idByVar[varName] = item.id;
                  this.varById[item.id] = varName;
                  currentRequest.captures[`"$.${index}.id"`] = `"${varName}"`;
                }
              }
            } else if (value.id && !this.varById[value.id]) {
              const varName = `capture_${Object.keys(this.idByVar).length}`;
              this.idByVar[varName] = value.id;
              this.varById[value.id] = varName;
              currentRequest.captures[`"$.id"`] = `"${varName}"`;
            }
            if (value.token) {
              currentRequest.captures['"$.token"'] = `"token"`;
            }
          });
        }
        setTimeout(() => {
          this.setRequestHeaders(currentRequest);
          this.setRequestExpectations(currentRequest);
        }, 500);
        this.requests.push(currentRequest);
        return res;
      }
    }
  }

  public setRequestHeaders(request: RecordedRequest) {
    for (let key in request.rawHeaders) {
      const headerValue = this.headerCallback(key, request.rawHeaders[key]);
      if (headerValue !== null) {
        request.testHeaders[key] = headerValue;
      }
    }
  }

  public setRequestExpectations(request: RecordedRequest) {
    request.expectStatusCode = true;
    request.expectProperties = [];

    request.keep = this.keepRequestCallback(request);
    
    if (!request.response.data) return;
    if (request.response.type === 'array') {
      request.expectProperties['response.length'] = request.response.data.length;
    } else if (Object.keys(request.response.data).length > 0) {
      for (let key in request.response.data) {
        const keyVal = request.response.data[key];
        let expect: ExpectProperty = {
          key: key,
          prop: `{{ response.${key} }}`,
          type: 'exact'
        };
        if (typeof keyVal === 'string') {
          if (this.varById[keyVal]) {
            // just need to make sure it is not a capture from this request
            let ok = true;
            let index = 0;
            for (let capture in request.captures) {
              if (request.captures[capture] === `"${this.varById[keyVal]}"`) {
                ok = false;
                break;
              }
              if (index > request.maxCaptureIndex) {
                ok = false;
                break;
              }
              index++;
            }
            if (ok) {
              expect.capturedValue = `"{{ ${this.varById[keyVal]} }}"`;
            }
          }
          expect.originalValue = `"${keyVal}"`;
          expect.expectedValue = `"${keyVal}"`;
          expect.type = expect.capturedValue ? 'captured' : 'exact';
        } else if (typeof keyVal === 'number') {
          expect.originalValue = `${keyVal}`;
          expect.expectedValue = `${keyVal}`;
        } else {
          expect.type = 'has';
        }
        this.expectPropertyCallback(expect);
        request.expectProperties.push(expect);
      }
    }
  }

  public handleEvent(event: Event) {
    if (this.recording) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start() {
    this.recording = true;
  }

  public stop() {
    this.recording = false;
  }

  public toggle() {
    this.recording = !this.recording;
  }

}

export interface ExpectProperty {
  prop: string;
  key: string;
  originalValue?: string;
  expectedValue?: string;
  capturedValue?: string;
  type: 'exact' | 'captured' | 'has' | 'ignore';
}

export class RecordedRequest {
  public rawUrl: string;
  public testUrl: string;
  public method: string;
  public rawHeaders: {[key: string]: any} = {};
  public testHeaders: {[key: string]: any} = {};
  public rawBody: any;
  public testBody: any;
  public response: RecordedResponse;
  public captures: {[key: string]: string} = {};
  public keep: boolean = true;
  public expectStatusCode: boolean = true;
  public expectProperties: Array<ExpectProperty> = [];
  public maxCaptureIndex: number = 0;
}

export class RecordedResponse {
  public statusCode: number;
  public statusText: string;
  public type: 'array' | 'object';
  public headers: {[key: string]: any} = {};
  public data: any;
}