export interface ILoginDto {
  username: string;
  password: string;
}

export interface IUserDto {
  idusuario: number;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  login: string;
  imagen: string;
  condicion: number;
  idrol?: number;
  rol?: string;
  permisos: string[];
  rolePermissions?: string[];
  idcomercio?: number;
  idsucursal?: number;
  sucursales?: number[];
}

export interface ILoginResponse {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  user?: IUserDto;
  message?: string;
}

export interface IRefreshTokenResponse {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}
