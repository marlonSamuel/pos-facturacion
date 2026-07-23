import type { IUser, IComercioPublicInfo } from '../../interfaces/IAuth';

export interface IAuthState {
  errorMessage: string;
  logged: boolean;
  user: IUser | null;
  token: string | null;
  comercioInfo: IComercioPublicInfo | null;
}

export const initialState: IAuthState = {
  errorMessage: '',
  logged: false,
  user: null,
  token: null,
  comercioInfo: null
};

export type AuthAction =
  | { type: 'login'; payload: { token: string; user: IUser } }
  | { type: 'logout' }
  | { type: 'addError'; payload: string }
  | { type: 'removeError' }
  | { type: 'updateUser'; payload: { user: IUser } }
  | { type: 'setComercioInfo'; payload: { info: IComercioPublicInfo } };

export const authReducer = (state: IAuthState, action: AuthAction): IAuthState => {
  switch (action.type) {
    case 'login':
      return {
        ...state,
        logged: true,
        token: action.payload.token,
        user: action.payload.user
      };
    case 'setComercioInfo':
      return {
        ...state,
        comercioInfo: action.payload.info
      };
    case 'logout':
      return {
        ...state,
        logged: false,
        user: null,
        token: null
      };
    case 'addError':
      return {
        ...state,
        errorMessage: action.payload
      };
    case 'removeError':
      return {
        ...state,
        errorMessage: ''
      };
    case 'updateUser':
      return {
        ...state,
        user: action.payload.user
      };
    default:
      return state;
  }
};
