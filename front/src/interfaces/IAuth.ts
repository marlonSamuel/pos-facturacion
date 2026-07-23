export interface ILoginData {
  username: string;
  password: string;
}

export interface IUser {
  idusuario: number;
  nombre: string;
  login: string;
  imagen: string;
  permisos: string[];
  condicion: number;
  tipo_documento: string;
  num_documento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  idcomercio?: number;
  idsucursal?: number;
  sucursales?: number[];
  idrol?: number;
  rol?: string;
  cargo?: string;
}

export interface IComercioPublicInfo {
  idcomercio: number;
  nombre: string;
  nombre_comercial?: string;
  nickname: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo?: string;
  color_primario?: string;
}
