export interface IRol {
  idrol: number;
  nombre: string;
  descripcion?: string;
  permisos: number[];
}

export interface IRolDto {
  nombre: string;
  descripcion?: string;
  permisos: number[];
}

export interface IPermissionInfo {
  idpermiso: number;
  nombre: string;
}
