export interface IUserDto {
  idusuario?: number;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  login: string;
  clave?: string;
  imagen?: string;
  condicion?: number;
  idrol?: number;
  permisos?: number[];
  sucursales?: number[];
}

export interface IUserResponse {
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
  rol?: string | null;
  permisos: number[];
  sucursal?: string;
  sucursales: number[];
}

export interface IChangePasswordDto {
  idusuario: number;
  clave_actual: string;
  clave_nueva: string;
}

export interface IUpdateProfileDto {
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion?: string;
  telefono?: string;
}
