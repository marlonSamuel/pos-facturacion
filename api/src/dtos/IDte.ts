export interface IDteLoginResponse {
  message: string;
  token: string | null;
  rpta: boolean;
}

export interface IDteCertifyResponse {
  message: string;
  serie?: string;
  num?: string;
  html?: string;
  autorizacion?: string;
  rpta: boolean;
}

export interface IDteCancelResponse {
  message: string;
  rpta: boolean;
}

export interface ISatFacturaResponse {
  idfactura: number;
  idventa: number;
  estado: number;
  autorizacion: string;
  serie: string;
  numero: string;
  fecha_certificacion: string;
  total: number;
  impuesto: number;
  ResponseDATA3?: string;
  [key: string]: any;
}
