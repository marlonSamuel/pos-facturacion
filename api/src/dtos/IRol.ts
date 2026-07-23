export interface IRolDto {
  nombre: string;
  descripcion?: string;
  permisos: number[];
}

export interface IRolResponse {
  idrol: number;
  nombre: string;
  descripcion: string | null;
  permisos: number[];
}
