import { ApiRequestLog } from '../models';
export class ApiRequestLogger {
  /**
   * Registra una petición a API externa (DTE, etc.)
   */
  static async log(params: {
    idsucursal?: number;
    endpoint: string;
    requestUrl?: string;
    requestBody?: string;
    responseStatus?: string;
    responseBody?: string;
    success: boolean;
  }) {
    try {
      await ApiRequestLog.create({
        idsucursal: params.idsucursal || null,
        endpoint: params.endpoint,
        request_url: params.requestUrl ? params.requestUrl.slice(0, 2000) : null,
        request_body: params.requestBody ? params.requestBody.slice(0, 5000) : null,
        response_status: params.responseStatus || null,
        response_body: params.responseBody ? params.responseBody.slice(0, 5000) : null,
        success: params.success ? 1 : 0
      } as any);
    } catch {
      // Silent fail â no debe interrumpir el flujo principal
    }
  }
}

