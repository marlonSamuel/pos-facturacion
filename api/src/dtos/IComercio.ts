export interface IComercioDto {
  idcomercio: number;
  nombre: string;
  nickname: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo?: string;
  color_primario?: string;
  condicion: number;
}

export interface IComercioPublicInfo {
  idcomercio: number;
  nombre: string;
  nickname: string;
  logo?: string;
  color_primario?: string;
}

export interface ISucursalDto {
  idsucursal: number;
  idcomercio: number;
  codigo?: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  condicion: number;
  nit?: string;
  nombre_emisor?: string;
  nombre_comercial?: string;
  direccion_emisor?: string;
  regimen: 'GEN' | 'PEQ';
}
