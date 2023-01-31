export let initState = {
  stateVersion: '1.0'
};

export interface DecoAppState {
  [key: string]: any,
  language: string;
  languages: Array<string>;
  country?: string;
  countries: Array<string>;
  refLanguage?: string;
  stateVersion: string;
}
