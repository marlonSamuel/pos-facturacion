export interface IDetalleVentaDto {
  idarticulo: number;
  cantidad: number;
  precio_venta: number;
  descuento: number;
}

export interface IVentaDto {
  idcliente: number;
  tipo_comprobante: string;
  tipo_venta: string;
  serie_comprobante?: string;
  num_comprobante?: string;
  fecha_hora: string;
  impuesto?: number;
  total_venta: number;
  detalles: IDetalleVentaDto[];
}

export interface IVentaResponse {
  idventa: number;
  idcliente: number;
  cliente?: string;
  idusuario: number;
  usuario?: string;
  tipo_comprobante: string;
  tipo_venta: string;
  serie_comprobante: string | null;
  num_comprobante: string | null;
  fecha_hora: string;
  impuesto: number;
  total_venta: number;
  estado: string;
  email?: string;
  direccion?: string;
  num_documento?: string;
  html?: string;
  autorizacion?: string;
  pdfUrl?: string;
  sucursal?: string;
  detalles?: IDetalleVentaResponse[];
}

export interface IDetalleVentaResponse {
  iddetalle_venta: number;
  idarticulo: number;
  articulo?: string;
  cantidad: number;
  precio_venta: number;
  descuento: number;
  subtotal: number;
}
