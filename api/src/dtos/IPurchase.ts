export interface IDetalleIngresoDto {
  idarticulo: number;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
}

export interface IIngresoDto {
  idproveedor: number;
  tipo_comprobante: string;
  serie_comprobante?: string;
  num_comprobante: string;
  fecha_hora: string;
  impuesto?: number;
  total_compra: number;
  detalles: IDetalleIngresoDto[];
}

export interface IIngresoResponse {
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
  detalles?: IDetalleIngresoResponse[];
}

export interface IDetalleIngresoResponse {
  iddetalle_ingreso: number;
  idarticulo: number;
  articulo?: string;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
}
