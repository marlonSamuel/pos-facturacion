/**
 * SaleService — Test Suite
 * El más complejo: usa DteService, transacciones, y lógica de certificación DTE.
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
  selfFilter: () => ({}),
}));

jest.mock('../../src/models', () => ({
  Venta: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  DetalleVenta: {
    create: jest.fn(),
  },
  Person: {
    findByPk: jest.fn(),
  },
  Articulo: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  ArticuloSucursal: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Usuario: {},
  SatFactura: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    transaction: jest.fn(),
    literal: jest.fn((val: string) => val),
  },
}));

jest.mock('../../src/services/DteService', () => ({
  DteService: jest.fn().mockImplementation(() => ({
    certificar: jest.fn(),
    anular: jest.fn(),
    anularPorAutorizacion: jest.fn(),
  })),
}));
jest.mock('../../src/services/AuditService', () => ({
  AuditService: {
    registrar: jest.fn(),
  },
}));

import { Venta, DetalleVenta, Person, Articulo, ArticuloSucursal, SatFactura } from '../../src/models';
import { sequelize } from '../../src/common/database/mysql';
import { SaleService } from '../../src/services/SaleService';
import { DteService } from '../../src/services/DteService';

const mockVenta = Venta as jest.Mocked<typeof Venta>;
const mockDetalleVenta = DetalleVenta as jest.Mocked<typeof DetalleVenta>;
const mockPerson = Person as jest.Mocked<typeof Person>;
const mockArticulo = Articulo as jest.Mocked<typeof Articulo>;
const mockArticuloSucursal = ArticuloSucursal as jest.Mocked<typeof ArticuloSucursal>;
const mockSatFactura = SatFactura as jest.Mocked<typeof SatFactura>;

let service: SaleService;
let mockDteService: jest.Mocked<DteService>;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };

const mockHeaderRow = {
  idventa: 1,
  idcliente: 1,
  idusuario: 1,
  tipo_comprobante: 'Boleta',
  serie_comprobante: 'B001',
  num_comprobante: '000001',
  fecha_hora: '2026-07-01T10:00:00',
  impuesto: 12,
  total_venta: 500,
  estado: 'Aceptado',
  cliente: { nombre: 'Cliente A', tipo_documento: 'CF', num_documento: 'CF', direccion: '', email: '', telefono: '' },
  usuario: { nombre: 'Admin' },
  detalles: [{ idarticulo: 1, cantidad: 2, precio_venta: 250, descuento: 0, articulo: { nombre: 'Art A' } }],
  get: function () { return this; },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDteService = new DteService() as jest.Mocked<DteService>;
  service = new SaleService(mockDteService);
  (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
});

// ============================================================
// getAll
// ============================================================
describe('getAll', () => {
  it('debe retornar todas las ventas', async () => {
    (mockVenta.findAll as jest.Mock).mockResolvedValue([mockHeaderRow]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
    expect((result[0] as any).idventa).toBe(1);
  });
});

// ============================================================
// getAllPaginated
// ============================================================
describe('getAllPaginated', () => {
  it('debe retornar ventas paginadas con total y totalPages', async () => {
    const allRows = Array.from({ length: 25 }, (_, i) => ({
      ...mockHeaderRow, idventa: i + 1,
    }));
    (mockVenta.findAndCountAll as jest.Mock).mockResolvedValue({ rows: allRows.slice(0, 10), count: 25 });
    const result = await service.getAllPaginated(1, 10);
    expect(result.rows).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('debe retornar página 2 correctamente', async () => {
    const allRows = Array.from({ length: 25 }, (_, i) => ({
      ...mockHeaderRow, idventa: i + 1,
    }));
    (mockVenta.findAndCountAll as jest.Mock).mockResolvedValue({ rows: allRows.slice(10, 20), count: 25 });
    const result = await service.getAllPaginated(2, 10);
    expect(result.rows).toHaveLength(10);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('debe retornar página vacía si el page excede el total', async () => {
    (mockVenta.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 25 });
    const result = await service.getAllPaginated(999, 10);
    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });
});

// ============================================================
// getById
// ============================================================
describe('getById', () => {
  it('debe retornar venta con detalle', async () => {
    (mockVenta.findOne as jest.Mock).mockResolvedValue(mockHeaderRow);
    const result = await service.getById(1);
    expect(result).toBeDefined();
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockVenta.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Venta no encontrada');
  });
});

// ============================================================
// create — Boleta (sin DTE)
// ============================================================
describe('create — Boleta/Ticket', () => {
  const saleData = {
    idcliente: 1,
    tipo_comprobante: 'Boleta',
    tipo_venta: 'CA',
    fecha_hora: '2026-07-01T10:00:00',
    total_venta: 500,
    impuesto: 0,
    detalles: [
      { idarticulo: 1, cantidad: 2, precio_venta: 250, descuento: 0 },
    ],
  };

  it('debe crear venta tipo Boleta sin DTE', async () => {
    // Validar stock via ArticuloSucursal
    (mockArticulo.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'Art A' }) } as any);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 10 }) } as any);
    (mockVenta.create as jest.Mock).mockResolvedValue({ idventa: 1, get: () => ({ idventa: 1 }) } as any);
    (mockDetalleVenta.create as jest.Mock).mockResolvedValue(undefined);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.create(saleData, 1);
    expect(result.idventa).toBe(1);
    // Verificar que busca stock en sucursal activa (idsucursal=1)
    expect(mockArticuloSucursal.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idarticulo: 1, idsucursal: 1 } })
    );
    // Verificar que descuenta stock en sucursal activa
    expect(mockArticuloSucursal.update).toHaveBeenCalledWith(
      { stock: expect.any(String) },
      expect.objectContaining({ where: { idarticulo: 1, idsucursal: 1 } })
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe rechazar si hay stock insuficiente', async () => {
    (mockArticulo.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'Art A' }) } as any);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 1 }) } as any);
    await expect(service.create(saleData, 1)).rejects.toThrow('Stock insuficiente');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('debe generar serie/número auto si no se proveen', async () => {
    (mockArticulo.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'Art A' }) } as any);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 10 }) } as any);
    (mockVenta.create as jest.Mock).mockResolvedValue({ idventa: 5, get: () => ({ idventa: 5 }) } as any);
    (mockDetalleVenta.create as jest.Mock).mockResolvedValue(undefined);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.create(saleData, 1);
    expect(result.serie).toMatch(/^B\d+/); // Boleta → prefijo B
  });

  it('debe crear venta al crédito (CR)', async () => {
    const creditData = { ...saleData, tipo_venta: 'CR' as const };
    (mockArticulo.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'Art A' }) } as any);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 10 }) } as any);
    (mockVenta.create as jest.Mock).mockResolvedValue({ idventa: 2, get: () => ({ idventa: 2 }) } as any);
    (mockDetalleVenta.create as jest.Mock).mockResolvedValue(undefined);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.create(creditData, 1);
    expect(result.idventa).toBe(2);
    expect(mockTransaction.commit).toHaveBeenCalled();
    // Verificar que se haya llamado a Venta.create con tipo_venta='CR'
    const createCall = (mockVenta.create as jest.Mock).mock.calls[0][0];
    expect(createCall.tipo_venta).toBe('CR');
  });
});

// ============================================================
// create — Factura (con DTE)
// ============================================================
describe('create — Factura (con DTE)', () => {
  const facturaData = {
    idcliente: 1,
    tipo_comprobante: 'Factura',
    tipo_venta: 'CA',
    fecha_hora: '2026-07-01T10:00:00',
    total_venta: 500,
    impuesto: 53.57,
    detalles: [
      { idarticulo: 1, cantidad: 2, precio_venta: 250, descuento: 0 },
    ],
  };

  it('debe certificar DTE primero, luego crear venta', async () => {
    // Mock DTE certification success
    (mockDteService.certificar as jest.Mock).mockResolvedValue({
      rpta: true, serie: 'F001', num: '000001',
      autorizacion: 'ABC123', html: '<html/>', pdfUrl: '/facturas/test.pdf',
      dteData: { Autorizacion: 'ABC123', Serie: 'F001', NUMERO: '000001',
        AcuseReciboSAT: 'ok', Fecha_DTE: '2026-07-01', NIT_EFACE: '44653948',
        NOMBRE_EFACE: 'New Horizon', NIT_COMPRADOR: 'CF', NOMBRE_COMPRADOR: 'Cliente',
        ResponseDATA1: Buffer.from('{}').toString('base64'),
        ResponseDATA2: Buffer.from('{}').toString('base64'),
        BACKPROCESOR: '', Fecha_de_certificacion: '2026-07-01' },
      message: 'OK',
    });

    // Mock cliente
    (mockPerson.findByPk as jest.Mock).mockResolvedValue({ get: () => ({
      nombre: 'Cliente A', email: '', direccion: '', num_documento: 'CF',
    }) } as any);

    // Mock artículos bulk fetch
    (mockArticulo.findAll as jest.Mock).mockResolvedValue([{ get: () => ({ idarticulo: 1, nombre: 'Art A' }) } as any]);

    // Mock transacción
    (mockArticulo.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'Art A' }) } as any);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 10 }) } as any);
    (mockVenta.create as jest.Mock).mockResolvedValue({ idventa: 1, get: () => ({ idventa: 1 }) } as any);
    (mockDetalleVenta.create as jest.Mock).mockResolvedValue(undefined);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);
    (mockSatFactura.create as jest.Mock).mockResolvedValue(undefined);

    const result = await service.create(facturaData, 1, 'admin', '127.0.0.1');
    expect(result.idventa).toBe(1);
    expect(result.autorizacion).toBe('ABC123');
    expect(mockDteService.certificar).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe fallar si DTE no certifica (rpta false)', async () => {
    (mockDteService.certificar as jest.Mock).mockResolvedValue({
      rpta: false, message: 'Token inválido', serie: '', num: '', html: '', autorizacion: '',
    });
    (mockPerson.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'C', email: '', direccion: '', num_documento: '' }) } as any);
    (mockArticulo.findAll as jest.Mock).mockResolvedValue([]);

    await expect(service.create(facturaData, 1, 'admin', '127.0.0.1'))
      .rejects.toThrow('Error al certificar DTE');
    // La transacción no debería iniciarse
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('debe auditar si DTE lanza excepción (token fail)', async () => {
    (mockDteService.certificar as jest.Mock).mockRejectedValue(new Error('SAT connection failed'));
    (mockPerson.findByPk as jest.Mock).mockResolvedValue({ get: () => ({ nombre: 'C', email: '', direccion: '', num_documento: '' }) } as any);
    (mockArticulo.findAll as jest.Mock).mockResolvedValue([]);

    await expect(service.create(facturaData, 1, 'admin', '127.0.0.1'))
      .rejects.toThrow('SAT connection failed');
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });
});

// ============================================================
// cancel
// ============================================================
describe('cancel', () => {
  it('debe anular venta tipo Boleta', async () => {
    (mockVenta.findOne as jest.Mock).mockResolvedValue({
      get: () => ({ idventa: 1, estado: 'Aceptado', tipo_comprobante: 'Boleta',
        detalles: [{ idarticulo: 1, cantidad: 2, get: function () { return this; } }] }),
    } as any);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);
    (mockVenta.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.cancel(1);
    expect(result).toEqual({ ok: true });
    expect(mockArticuloSucursal.update).toHaveBeenCalledWith(
      { stock: expect.any(String) },
      expect.objectContaining({ where: { idarticulo: 1, idsucursal: 1 } })
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe anular venta tipo Factura (con anulación DTE)', async () => {
    (mockVenta.findOne as jest.Mock).mockResolvedValue({
      get: () => ({ idventa: 1, estado: 'Aceptado', tipo_comprobante: 'Factura', total_venta: 500,
        detalles: [{ idarticulo: 1, cantidad: 2, get: function () { return this; } }] }),
    } as any);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);
    (mockVenta.update as jest.Mock).mockResolvedValue(undefined);
    (mockSatFactura.update as jest.Mock).mockResolvedValue(undefined);
    (mockDteService.anular as jest.Mock).mockResolvedValue(undefined);

    const result = await service.cancel(1, undefined, 'admin', '127.0.0.1');
    expect(result).toEqual({ ok: true });
    expect(mockDteService.anular).toHaveBeenCalledWith(1, undefined);
  });

  it('debe rechazar si ya está anulada', async () => {
    (mockVenta.findOne as jest.Mock).mockResolvedValue({
      get: () => ({ idventa: 1, estado: 'Anulado', tipo_comprobante: 'Boleta', detalles: [] }),
    } as any);
    await expect(service.cancel(1)).rejects.toThrow('La venta ya está anulada');
  });
});

// ============================================================
// cancel - con motivo de anulación
// ============================================================
describe('cancel con motivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.rollback.mockReset();
    mockTransaction.commit.mockReset();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  it('debe guardar motivo_anulacion al cancelar', async () => {
    const { Venta, DetalleVenta, SatFactura } = require('../../src/models');
    Venta.findOne = jest.fn().mockResolvedValue({
      get: () => ({
        idventa: 1, idcliente: 1, idusuario: 1, tipo_comprobante: 'Boleta',
        serie_comprobante: 'B001', num_comprobante: '000001',
        fecha_hora: new Date(), impuesto: 0, total_venta: 100,
        estado: 'Aceptado', idsucursal: 1,
        detalles: [
          { get: () => ({ idarticulo: 1, cantidad: 2 }) }
        ]
      }),
    });
    Venta.update = jest.fn().mockResolvedValue([1]);
    const { ArticuloSucursal } = require('../../src/models');
    ArticuloSucursal.update = jest.fn().mockResolvedValue([1]);

    const service = new SaleService(new DteService());
    const result = await service.cancel(1, 'Error en el pedido');

    expect(result).toEqual({ ok: true });
    expect(Venta.update).toHaveBeenCalledWith(
      { estado: 'Anulado', motivo_anulacion: 'Error en el pedido' },
      expect.any(Object)
    );
  });

  it('debe guardar motivo_anulacion como null si no se provee', async () => {
    const { Venta, DetalleVenta } = require('../../src/models');
    Venta.findOne = jest.fn().mockResolvedValue({
      get: () => ({
        idventa: 2, idcliente: 1, idusuario: 1, tipo_comprobante: 'Boleta',
        serie_comprobante: 'B002', num_comprobante: '000002',
        fecha_hora: new Date(), impuesto: 0, total_venta: 50,
        estado: 'Aceptado', idsucursal: 1,
        detalles: [
          { get: () => ({ idarticulo: 2, cantidad: 1 }) }
        ]
      }),
    });
    Venta.update = jest.fn().mockResolvedValue([1]);
    const { ArticuloSucursal } = require('../../src/models');
    ArticuloSucursal.update = jest.fn().mockResolvedValue([1]);

    const service = new SaleService(new DteService());
    const result = await service.cancel(2);

    expect(result).toEqual({ ok: true });
    expect(Venta.update).toHaveBeenCalledWith(
      { estado: 'Anulado', motivo_anulacion: null },
      expect.any(Object)
    );
  });
});
