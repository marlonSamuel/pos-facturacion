/**
 * DteService -- Test Suite
 * URLs de Digifact construidas dinamicamente desde .env + valores de sucursal en BD.
 */

jest.mock('../../src/common/request-context', () => ({
  getSucursalId: jest.fn(),
}));

const mockSucursalFindByPk = jest.fn();
const mockTokenDteFindOne = jest.fn();
const mockTokenDteCreate = jest.fn();

jest.mock('../../src/models', () => ({
  Sucursal: { findByPk: (...args: any[]) => mockSucursalFindByPk(...args) },
  TokenDte: {
    findOne: (...args: any[]) => mockTokenDteFindOne(...args),
    create: (...args: any[]) => mockTokenDteCreate(...args),
  },
  DetalleVenta: { findAll: jest.fn() },
  Venta: {},
  Person: {},
  Articulo: {},
  SatFactura: {},
}));

jest.mock('axios');

// Mock https una vez
const mockHttpsRes = {
  on: jest.fn((event: string, handler: any) => {
    if (event === 'data') handler(Buffer.from(JSON.stringify({
      Codigo: 1, Autorizacion: 'ABC123', Serie: 'F001', NUMERO: '000001',
      ResponseDATA2: Buffer.from('<html/>').toString('base64'),
      ResponseDATA3: Buffer.from('pdf-content').toString('base64'),
    })));
    if (event === 'end') handler();
  }),
  statusCode: 200,
};
const mockHttpsRequest = jest.fn((_url: any, _opts: any, cb: any) => {
  cb(mockHttpsRes);
  return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
});
jest.mock('https', () => ({ request: mockHttpsRequest }));

import { getSucursalId } from '../../src/common/request-context';
import { DteService } from '../../src/services/DteService';
import axios from 'axios';

const mockGetSucursalId = getSucursalId as jest.MockedFunction<typeof getSucursalId>;
const mockAxiosPost = axios.post as jest.Mock;

const TEST_ENV = {
  DTE_AUTH_URL: 'https://test.digifact.com.gt/auth/login',
  DTE_CERT_URL_BASE: 'https://test.digifact.com.gt/api/cert?NIT={NIT}&USERNAME={USERNAME}',
  DTE_CANCEL_URL_BASE: 'https://test.digifact.com.gt/api/cancel?NIT={NIT}&USERNAME={USERNAME}',
};

const makeSucursal = (overrides = {}) => ({
  get: () => ({
    nit: '12345678',
    nombre_emisor: 'Test Emisor',
    nombre_comercial: 'Test Comercial',
    direccion_emisor: 'Ciudad',
    codigo_postal: '01006',
    municipio: 'VILLA NUEVA',
    departamento: 'GUATEMALA',
    pais: 'GT',
    codigo_establecimiento: '1',
    regimen: 'GEN',
    usuario_digifact: 'PRUEBAS56',
    usuario_login: 'GT.000044653948.PRUEBAS56',
    password_digifact: 'testpass',
    ...overrides,
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.entries(TEST_ENV).forEach(([k, v]) => { process.env[k] = v; });
  mockGetSucursalId.mockReturnValue(1);
});

// ============================================================
// buildCertUrl (privado)
// ============================================================
describe('buildCertUrl', () => {
  it('debe usar usuario_digifact (corto) en la URL, no usuario_login', () => {
    const service = new DteService();
    const url = (service as any).buildCertUrl('44653948', 'PRUEBAS56');
    expect(url).toContain('USERNAME=PRUEBAS56');
    expect(url).not.toContain('GT.000044653948');
  });

  it('debe codificar caracteres especiales en NIT', () => {
    const service = new DteService();
    const url = (service as any).buildCertUrl('CF-123/456', 'user');
    expect(url).toContain(encodeURIComponent('CF-123/456'));
    expect(url).not.toContain('CF-123/456');
  });

  it('debe retornar cadena vacia si no hay DTE_CERT_URL_BASE', () => {
    delete process.env.DTE_CERT_URL_BASE;
    const service = new DteService();
    const url = (service as any).buildCertUrl('44653948', 'user');
    expect(url).toBe('');
  });
});

// ============================================================
// buildCancelUrl (privado)
// ============================================================
describe('buildCancelUrl', () => {
  it('debe usar usuario_digifact (corto) en la URL, no usuario_login', () => {
    const service = new DteService();
    const url = (service as any).buildCancelUrl('44653948', 'PRUEBAS56');
    expect(url).toContain('USERNAME=PRUEBAS56');
    expect(url).not.toContain('GT.000044653948');
  });

  it('debe retornar cadena vacia si no hay DTE_CANCEL_URL_BASE', () => {
    delete process.env.DTE_CANCEL_URL_BASE;
    const service = new DteService();
    const url = (service as any).buildCancelUrl('44653948', 'user');
    expect(url).toBe('');
  });
});

// ============================================================
// getSucursalConfig (privado)
// ============================================================
describe('getSucursalConfig', () => {
  it('debe cargar config con usuario_login y usuario_digifact separados', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    const service = new DteService();
    const config = await (service as any).getSucursalConfig();

    expect(config.usuarioDigifact).toBe('PRUEBAS56');
    expect(config.usuarioLogin).toBe('GT.000044653948.PRUEBAS56');
    expect(config.certUrl).toContain('USERNAME=PRUEBAS56');
    expect(config.certUrl).not.toContain('GT.000044653948');
  });

  it('debe lanzar error si no hay sucursal activa', async () => {
    mockGetSucursalId.mockReturnValue(null);
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('No hay sucursal activa');
  });

  it('debe lanzar 404 si la sucursal no existe', async () => {
    mockSucursalFindByPk.mockResolvedValue(null);
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('Sucursal no encontrada');
  });

  it('debe lanzar error si falta NIT', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal({ nit: '' }));
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('NIT del emisor no configurado');
  });

  it('debe lanzar error si falta usuario_digifact', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal({ usuario_digifact: '' }));
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('Usuario Digifact no configurado');
  });

  it('debe lanzar error si falta usuario_login', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal({ usuario_login: '' }));
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('Usuario login Digifact no configurado');
  });

  it('debe lanzar error si falta password', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal({ password_digifact: '' }));
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('Password Digifact no configurado');
  });

  it('debe lanzar error si falta DTE_AUTH_URL en .env', async () => {
    delete process.env.DTE_AUTH_URL;
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('DTE_AUTH_URL en .env');
  });

  it('debe lanzar error si DTE_CERT_URL_BASE no tiene {NIT}', async () => {
    delete process.env.DTE_CERT_URL_BASE;
    process.env.DTE_CERT_URL_BASE = 'https://test.com?NIT=hardcoded';
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    const service = new DteService();
    await expect((service as any).getSucursalConfig()).rejects.toThrow('DTE_CERT_URL_BASE en .env');
  });

  it('debe usar regimen PEQ si esta configurado', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal({ regimen: 'PEQ' }));
    const service = new DteService();
    const config = await (service as any).getSucursalConfig();
    expect(config.regimen).toBe('PEQ');
  });
});

// ============================================================
// getToken (privado)
// ============================================================
describe('getToken', () => {
  it('debe retornar token cacheado si no ha expirado', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    mockTokenDteFindOne.mockResolvedValue({
      get: () => ({ token: 'cached-token', expira_en: tomorrow.toISOString() }),
    });

    const service = new DteService();
    const token = await (service as any).getToken();
    expect(token).toBe('cached-token');
    expect(mockAxiosPost).not.toHaveBeenCalled();
    // Verificar que busca el token de la sucursal activa
    expect(mockTokenDteFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ 
        where: expect.objectContaining({ idsucursal: 1, otorgado_a: 'GT.000044653948.PRUEBAS56' }) 
      })
    );
  });

  it('debe llamar a login con usuario_login, no usuario_digifact', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    mockTokenDteFindOne.mockResolvedValue(null);
    mockAxiosPost.mockResolvedValue({
      data: { Token: 'new-token', expira_en: new Date().toISOString(), otorgado_a: 'test' },
    });

    const service = new DteService();
    const token = await (service as any).getToken();
    expect(token).toBe('new-token');
    // Verificar que el login usa usuario_login (completo), no usuario_digifact (corto)
    expect(mockAxiosPost).toHaveBeenCalledWith(
      TEST_ENV.DTE_AUTH_URL,
      { Username: 'GT.000044653948.PRUEBAS56', Password: 'testpass' },
      expect.any(Object)
    );
    // Verificar que token se guarda con idsucursal
    expect(mockTokenDteCreate).toHaveBeenCalledWith(
      expect.objectContaining({ idsucursal: 1 })
    );
  });

  it('debe propagar error si login falla', async () => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    mockTokenDteFindOne.mockResolvedValue(null);
    mockAxiosPost.mockRejectedValue(new Error('Network error'));

    const service = new DteService();
    await expect((service as any).getToken()).rejects.toThrow('No se pudo obtener token DTE');
  });
});

// ============================================================
// certificar (publico) -- smoke test
// ============================================================
describe('certificar', () => {
  const ventaMock = {
    idventa: 1, idcliente: 1, idusuario: 1,
    tipo_comprobante: 'Factura', fecha_hora: '2026-07-01T10:00:00',
    total_venta: 500, impuesto: 53.57,
    cliente: 'Cliente Test', email: '', num_documento: 'CF', direccion: '',
  };

  const detallesMock = [
    { iddetalle_venta: 1, idarticulo: 1, articulo: 'Art A', cantidad: 2, precio_venta: 250, descuento: 0, subtotal: 500 },
  ];

  beforeEach(() => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    mockTokenDteFindOne.mockResolvedValue(null);
    mockAxiosPost.mockResolvedValue({
      data: { Token: 'test-token', expira_en: new Date().toISOString(), otorgado_a: 'test' },
    });
  });

  it('debe certificar y retornar datos de factura', async () => {
    const service = new DteService();
    const result = await service.certificar(ventaMock as any, detallesMock);
    expect(result.rpta).toBe(true);
    expect(result.autorizacion).toBe('ABC123');
    expect(result.serie).toBe('F001');
  });
});

// ============================================================
// anular (publico)
// ============================================================
describe('anular', () => {
  beforeEach(() => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    mockTokenDteFindOne.mockResolvedValue(null);
    mockAxiosPost.mockResolvedValue({
      data: { Token: 'test-token', expira_en: new Date().toISOString(), otorgado_a: 'test' },
    });
  });

  it('debe anular DTE y marcar estado=1 en sat_facturas', async () => {
    const { SatFactura } = require('../../src/models');
    SatFactura.findOne = jest.fn().mockResolvedValue({
      get: () => ({ autorizacion: 'ABC123', nit_comprador: 'CF', fecha_certificacion: '2026-07-01' }),
    });
    SatFactura.update = jest.fn().mockResolvedValue([1]);

    mockAxiosPost.mockResolvedValueOnce({
      data: { Token: 'cancel-token', expira_en: new Date(Date.now() + 86400000).toISOString(), otorgado_a: 'test' },
    });

    const service = new DteService();
    await service.anular(1);

    // Verificar que se llamó a https.request con la URL de cancelación
    const cancelCall = mockHttpsRequest.mock.calls.find((call: any[]) => call[0]?.href?.includes('cancel'));
    expect(cancelCall).toBeDefined();
    expect(cancelCall![0].href).toContain('USERNAME=PRUEBAS56');
    expect(cancelCall![0].href).not.toContain('GT.000044653948');
    expect(SatFactura.update).toHaveBeenCalledWith({ estado: 1 }, { where: { idventa: 1 } });
  });

  it('debe lanzar 404 si no existe factura DTE', async () => {
    const { SatFactura } = require('../../src/models');
    SatFactura.findOne = jest.fn().mockResolvedValue(null);

    const service = new DteService();
    await expect(service.anular(999)).rejects.toThrow('No se encontro factura DTE');
  });
});

// ============================================================
// anularPorAutorizacion (publico)
// ============================================================
describe('anularPorAutorizacion', () => {
  beforeEach(() => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    mockTokenDteFindOne.mockResolvedValue(null);
    mockAxiosPost.mockResolvedValue({
      data: { Token: 'test-token', expira_en: new Date().toISOString(), otorgado_a: 'test' },
    });
  });

  it('debe enviar XML de anulacion con usuario_digifact en URL', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { Token: 'rollback-token', expira_en: new Date(Date.now() + 86400000).toISOString(), otorgado_a: 'test' },
    });
    mockAxiosPost.mockResolvedValueOnce({ data: 'ok' });

    const service = new DteService();
    await service.anularPorAutorizacion('AUTH123', '12345678', 500, '2026-07-01');

    const cancelCall = mockAxiosPost.mock.calls.find((call: any[]) => call[0]?.includes('cancel'));
    expect(cancelCall).toBeDefined();
    expect(cancelCall[0]).toContain('USERNAME=PRUEBAS56');
    expect(cancelCall[0]).not.toContain('GT.000044653948');
  });

  it('debe tolerar error de SAT sin lanzar excepcion (compensatorio)', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { Token: 'rollback-token', expira_en: new Date(Date.now() + 86400000).toISOString(), otorgado_a: 'test' },
    });
    mockAxiosPost.mockRejectedValueOnce(new Error('SAT timeout'));

    const service = new DteService();
    await expect(service.anularPorAutorizacion('AUTH123', '12345678', 500, '2026-07-01')).resolves.not.toThrow();
  });
});

// ============================================================
// getToken - Token refresh logic
// ============================================================
describe('getToken', () => {
  beforeEach(() => {
    mockSucursalFindByPk.mockResolvedValue(makeSucursal());
    jest.clearAllMocks();
  });

  it('debe reusar token si expira en >= 15 minutos', async () => {
    const futuro = new Date(Date.now() + 30 * 60 * 1000); // +30 min
    mockTokenDteFindOne.mockResolvedValue({
      get: () => ({ token: 'token-valido', expira_en: futuro.toISOString(), otorgado_a: 'test' }),
    });
    // Simular que getToken se llama internamente
    const service = new DteService();
    // Llamamos a un método público que use getToken internamente
    // Pero getToken es privado, así que verificamos el comportamiento a través de anular
    // Primero configuramos SatFactura.findOne
    const { SatFactura } = require('../../src/models');
    SatFactura.findOne = jest.fn().mockResolvedValue({
      get: () => ({ autorizacion: 'ABC', nit_comprador: 'CF', fecha_certificacion: '2026-07-01' }),
    });
    SatFactura.update = jest.fn();
    
    mockAxiosPost.mockResolvedValueOnce({
      data: { Token: 'nuevo-token', expira_en: new Date(Date.now() + 86400000).toISOString(), otorgado_a: 'test' },
    });
    
    await service.anular(1);
    
    // No debería haberse llamado a login (axios.post) porque el token es válido
    // Pero el login sí se llama porque findOne devuelve null por defecto y no pasamos el mock...
    // En realidad verificamos que NO se llama login adicional
    const authCalls = mockAxiosPost.mock.calls.filter(c => c[0]?.includes('auth'));
    expect(authCalls.length).toBe(0);
  });

  it('debe refrescar token si expira en menos de 15 minutos', async () => {
    const casiExpirado = new Date(Date.now() + 5 * 60 * 1000); // +5 min
    mockTokenDteFindOne.mockResolvedValue({
      get: () => ({ token: 'token-casi-expirado', expira_en: casiExpirado.toISOString(), otorgado_a: 'test' }),
    });
    
    const { SatFactura } = require('../../src/models');
    SatFactura.findOne = jest.fn().mockResolvedValue({
      get: () => ({ autorizacion: 'ABC', nit_comprador: 'CF', fecha_certificacion: '2026-07-01' }),
    });
    SatFactura.update = jest.fn();
    
    mockAxiosPost.mockResolvedValue({
      data: { Token: 'nuevo-token', expira_en: new Date(Date.now() + 86400000).toISOString(), otorgado_a: 'test' },
    });
    
    const service = new DteService();
    await service.anular(1);
    
    // Debería haberse llamado a login (axios.post) porque token está por expirar
    const authCalls = mockAxiosPost.mock.calls.filter(c => c[0]?.includes('auth'));
    expect(authCalls.length).toBeGreaterThanOrEqual(1);
  });
});
