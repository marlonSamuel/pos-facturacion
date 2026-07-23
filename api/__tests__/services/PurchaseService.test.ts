/**
 * PurchaseService — Test Suite
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
}));

jest.mock('../../src/models', () => ({
  Ingreso: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  DetalleIngreso: {
    create: jest.fn(),
  },
  Person: {
    findByPk: jest.fn(),
  },
  Articulo: {
    update: jest.fn(),
  },
  ArticuloSucursal: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Usuario: {},
}));

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    transaction: jest.fn(),
    literal: jest.fn((val: string) => val),
  },
}));

import { Ingreso, DetalleIngreso, Person, Articulo, ArticuloSucursal } from '../../src/models';
import { sequelize } from '../../src/common/database/mysql';
import { PurchaseService } from '../../src/services/PurchaseService';

const mockIngreso = Ingreso as jest.Mocked<typeof Ingreso>;
const mockDetalleIngreso = DetalleIngreso as jest.Mocked<typeof DetalleIngreso>;
const mockPerson = Person as jest.Mocked<typeof Person>;
const mockArticulo = Articulo as jest.Mocked<typeof Articulo>;
const mockArticuloSucursal = ArticuloSucursal as jest.Mocked<typeof ArticuloSucursal>;

let service: PurchaseService;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };

const mockHeaderRow = {
  idingreso: 1,
  idproveedor: 1,
  idusuario: 1,
  tipo_comprobante: 'Factura',
  serie_comprobante: 'F001',
  num_comprobante: '000001',
  fecha_hora: '2026-07-01',
  impuesto: 12,
  total_compra: 1000,
  estado: 'Aceptado',
  proveedor: { nombre: 'Proveedor A' },
  usuario: { nombre: 'Admin' },
  get: function () { return this; },
};

beforeEach(() => {
  jest.clearAllMocks();
  service = new PurchaseService();
  (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
});

// ============================================================
// getAll
// ============================================================
describe('getAll', () => {
  it('debe retornar todas las compras', async () => {
    (mockIngreso.findAll as jest.Mock).mockResolvedValue([mockHeaderRow]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
    expect((result[0] as any).idingreso).toBe(1);
  });
});

// ============================================================
// getAllPaginated
// ============================================================
describe('getAllPaginated', () => {
  it('debe retornar compras paginadas', async () => {
    const allRows = Array.from({ length: 30 }, (_, i) => ({
      ...mockHeaderRow, idingreso: i + 1,
    }));
    (mockIngreso.findAndCountAll as jest.Mock).mockResolvedValue({ rows: allRows.slice(0, 15), count: 30 });
    const result = await service.getAllPaginated(1, 15);
    expect(result.rows).toHaveLength(15);
    expect(result.total).toBe(30);
    expect(result.totalPages).toBe(2);
  });

  it('debe retornar página vacía si el page excede el total', async () => {
    (mockIngreso.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 10 });
    const result = await service.getAllPaginated(999, 10);
    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(10);
  });
});

// ============================================================
// getById
// ============================================================
describe('getById', () => {
  it('debe retornar compra con detalle', async () => {
    const detailRow = {
      ...mockHeaderRow,
      detalles: [{ idarticulo: 1, cantidad: 5, precio_compra: 100, articulo: { nombre: 'Art A' } }],
      get: function () { return this; },
    };
    (mockIngreso.findOne as jest.Mock).mockResolvedValue(detailRow);
    const result = await service.getById(1);
    expect(result).toBeDefined();
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockIngreso.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Ingreso no encontrado');
  });
});

// ============================================================
// create
// ============================================================
describe('create', () => {
  const purchaseData = {
    idproveedor: 1,
    tipo_comprobante: 'Factura',
    serie_comprobante: 'F',
    num_comprobante: '001',
    fecha_hora: '2026-07-01',
    total_compra: 1000,
    impuesto: 12,
    detalles: [
      { idarticulo: 1, cantidad: 5, precio_compra: 100, precio_venta: 150 },
    ],
  };

  it('debe crear compra transaccionalmente', async () => {
    (mockPerson.findByPk as jest.Mock).mockResolvedValue({ idpersona: 1 } as any);
    (mockIngreso.create as jest.Mock).mockResolvedValue({ idingreso: 1, get: () => ({ idingreso: 1 }) } as any);
    (mockDetalleIngreso.create as jest.Mock).mockResolvedValue(undefined);
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue(null); // no existe, se creará
    (mockArticuloSucursal.create as jest.Mock).mockResolvedValue(undefined);
    // getById (llamado al final)
    (mockIngreso.findOne as jest.Mock).mockResolvedValue({
      ...mockHeaderRow,
      detalles: [{ idarticulo: 1, cantidad: 5, precio_compra: 100, articulo: { nombre: 'Art A' } }],
      get: function () { return this; },
    });

    const result = await service.create(purchaseData, 1);
    expect(result).toBeDefined();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockDetalleIngreso.create).toHaveBeenCalledTimes(1);
    // Verificar que crea stock en sucursal activa
    expect(mockArticuloSucursal.create).toHaveBeenCalledWith(
      expect.objectContaining({ idarticulo: 1, idsucursal: 1, stock: 5 }),
      expect.any(Object)
    );
  });

  it('debe lanzar error si proveedor no existe', async () => {
    (mockPerson.findByPk as jest.Mock).mockResolvedValue(null);
    await expect(service.create(purchaseData, 1)).rejects.toThrow('Proveedor no encontrado');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});

// ============================================================
// cancel
// ============================================================
describe('cancel', () => {
  it('debe anular compra y revertir stock', async () => {
    (mockIngreso.findOne as jest.Mock).mockResolvedValue({
      idingreso: 1,
      get: () => ({
        idingreso: 1,
        estado: 'Aceptado',
        detalles: [{ idarticulo: 1, cantidad: 5, get: function () { return this; } }],
      }),
    } as any);
    (mockArticuloSucursal.update as jest.Mock).mockResolvedValue(undefined);
    (mockIngreso.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.cancel(1);
    expect(result).toEqual({ ok: true });
    expect(mockArticuloSucursal.update).toHaveBeenCalledWith(
      { stock: expect.any(String) },
      expect.objectContaining({ where: { idarticulo: 1, idsucursal: 1 } })
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe rechazar si ya está anulado', async () => {
    (mockIngreso.findOne as jest.Mock).mockResolvedValue({
      idingreso: 1,
      get: () => ({ idingreso: 1, estado: 'Anulado', detalles: [] }),
    } as any);
    await expect(service.cancel(1)).rejects.toThrow('El ingreso ya está anulado');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
