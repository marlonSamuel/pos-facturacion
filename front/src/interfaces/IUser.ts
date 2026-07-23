export interface IUser {
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
  cargo?: string;
  permisos: number[];
  sucursal?: string | null;
  sucursales?: number[];
}

export interface IPermission {
  idpermiso: number;
  nombre: string;
}
