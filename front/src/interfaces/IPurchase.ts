export interface IPurchaseDetail {
  idarticulo: number;
  articulo?: string;
  cantidad: number;
  precio_compra: number;
}

export interface IPurchase {
  idingreso: number;
  idproveedor: number;
  proveedor?: string;
  idusuario: number;
  usuario?: string;
  tipo_comprobante: string;
  serie_comprobante: string | null;
  num_comprobante: string;
  fecha_hora: string;
  impuesto: number;
  total_compra: number;
  estado: string;
  sucursal?: string;
  detalles?: IPurchaseDetailFull[];
}

export interface IPurchaseDetailFull {
  iddetalle_ingreso: number;
  idarticulo: number;
  articulo?: string;
  cantidad: number;
  precio_compra: number;
}

export interface ICartItem {
  idarticulo: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  precio_compra: number;
  subtotal: number;
}
