export interface ICartItemSale {
  idarticulo: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  precio_venta: number;
  descuento: number;
  subtotal: number;
  stock?: number;
}

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
  fecha_hora: string;
  total_venta: number;
  impuesto?: number;
  detalles: IDetalleVentaDto[];
}

export interface IVenta {
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
  autorizacion?: string;
  pdfUrl?: string;
  sucursal?: string;
  detalles?: IDetalleVenta[];
}

export interface IDetalleVenta {
  iddetalle_venta: number;
  idarticulo: number;
  articulo?: string;
  cantidad: number;
  precio_venta: number;
  descuento: number;
  subtotal: number;
}
