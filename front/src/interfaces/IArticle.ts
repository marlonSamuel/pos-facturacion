export interface IArticle {
  idarticulo: number;
  idcategoria: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  precio_venta?: number;
  condicion: number;
  stock?: number;
  categoria?: { nombre: string };
}
