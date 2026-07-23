/**
 * ApiRequestLogger -- Test Suite
 * Fire-and-forget logger para peticiones a APIs externas (DTE).
 */

const mockCreate = jest.fn();

jest.mock('../../src/models', () => ({
  ApiRequestLog: { create: (...args: any[]) => mockCreate(...args) },
}));

import { ApiRequestLogger } from '../../src/services/ApiRequestLogger';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('log', () => {
  it('debe crear registro en api_request_logs con datos basicos', async () => {
    mockCreate.mockResolvedValue({ id: 1 });

    await ApiRequestLogger.log({
      idsucursal: 1,
      endpoint: 'dte-auth',
      requestUrl: 'https://test.digifact.com.gt/auth',
      requestBody: '{"Username":"test"}',
      responseStatus: '200',
      responseBody: '{"Token":"abc"}',
      success: true
    });

    expect(mockCreate).toHaveBeenCalledWith({
      idsucursal: 1,
      endpoint: 'dte-auth',
      request_url: 'https://test.digifact.com.gt/auth',
      request_body: '{"Username":"test"}',
      response_status: '200',
      response_body: '{"Token":"abc"}',
      success: 1
    });
  });

  it('debe marcar success=0 cuando falla', async () => {
    mockCreate.mockResolvedValue({ id: 1 });

    await ApiRequestLogger.log({
      endpoint: 'dte-certify',
      success: false,
      responseBody: 'Error SAT: token invalido'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      idsucursal: null,
      endpoint: 'dte-certify',
      request_url: null,
      request_body: null,
      response_status: null,
      response_body: 'Error SAT: token invalido',
      success: 0
    });
  });

  it('debe truncar campos largos a 5000 caracteres', async () => {
    mockCreate.mockResolvedValue({ id: 1 });
    const largo = 'x'.repeat(10000);
    const esperado = 'x'.repeat(5000);

    await ApiRequestLogger.log({
      endpoint: 'dte-certify',
      requestBody: largo,
      responseBody: largo,
      success: true
    });

    expect(mockCreate).toHaveBeenCalledWith({
      idsucursal: null,
      endpoint: 'dte-certify',
      request_url: null,
      request_body: esperado,
      response_status: null,
      response_body: esperado,
      success: 1
    });
  });

  it('debe truncar request_url a 2000 caracteres', async () => {
    mockCreate.mockResolvedValue({ id: 1 });
    const url = 'https://test.com/?' + 'x'.repeat(3000);
    const esperado = 'https://test.com/?' + 'x'.repeat(1985); // 2000 - longitud del prefijo

    await ApiRequestLogger.log({
      endpoint: 'dte-auth',
      requestUrl: url,
      success: true
    });

    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.request_url.length).toBeLessThanOrEqual(2000);
    expect(callArg.request_url).toBe(url.slice(0, 2000));
  });

  it('debe tolerar error de BD sin lanzar excepcion (silent fail)', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'));

    // No debe lanzar
    await expect(ApiRequestLogger.log({
      endpoint: 'dte-auth',
      success: true
    })).resolves.not.toThrow();
  });
});
