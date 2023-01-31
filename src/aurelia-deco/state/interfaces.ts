import { CurrentRoute } from './actions';
import { DecoAppState } from '../deco';
import { ProfileModel } from '../models';


export type Steps = 'login' | 'double-auth' | 'create-account' | 'validate-account' | 'account-created' | 'forgot-password' | 'reset-password';

export interface newAccountInterface {
  firstname?: string;
  lastname?: string;
  email?: string;
  mobile?: string;
}

export interface SwissdataState {
  publicKey: string;
  online?: 'unkown' | boolean;
  authenticated: boolean;
  loginStep: Steps;
  createAccountValidationToken?: string;
  newAccountInstance?: newAccountInterface | null;
  newAccountCountryPrefix?: string;
  newAccountPhone?: {countryCode: string, countryPrefix: string, placeholder: string, number: string};
  resetPasswordToken?: string;
  requireDoubleAuthValidation?: boolean;
  doubleAuthValidationToken?: string;
  user?: SwissdataUser;
  profile?: ProfileModel;
  accessToken?: string;
  refreshToken?: string;
  h: string; // host
}

export interface SwissdataUser {
  id: string;
  firstname?: string;
  lastname?: string;
  email: string;
  mobile: string;
  requireDoubleAuth: boolean;
  roles: Array<string>;
  hideOnboarding: boolean;
}

export interface SdLoginAccount {
  firstname: string;
  lastname: string;
  username: string;
  userId: string;
  profileUrl?: string;
}

export interface SdLoginState {
  username?: string;
  createAccountValidationToken?: string;
  createAccountValidationTokenExpiry?: string;
  resetPasswordToken?: string;
  requireDoubleAuthValidation?: boolean;
  doubleAuthValidationToken?: string;
  accounts?: Array<SdLoginAccount>; // list of userIds already logged with this computer
}

export interface AppState extends DecoAppState {
  [key: string]: any;
  swissdata: SwissdataState;
  sdlogin: SdLoginState;
  currentRoute: CurrentRoute;
}
