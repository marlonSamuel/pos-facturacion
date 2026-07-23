export interface ICategoriaDto {
  idcategoria?: number;
  nombre: string;
  descripcion?: string;
  condicion?: number;
}

export interface IArticuloDto {
  idarticulo?: number;
  idcategoria: number;
  codigo?: string;
  nombre: string;
  stock?: number;
  descripcion?: string;
  imagen?: string;
  precio_venta?: number;
  condicion?: number;
}
