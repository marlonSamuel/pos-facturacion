/**
 * InventoryService — Test Suite
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: jest.fn(() => ({})),
  getSucursalId: jest.fn(() => 1),
  comercioFilter: jest.fn(() => ({})),
}));

jest.mock('../../src/models', () => ({
  ArticuloSucursal: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
  },
  Articulo: {},
  Categoria: {},
}));

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    query: jest.fn(),
    literal: jest.fn((val: string) => val),
  },
}));

import { ArticuloSucursal } from '../../src/models';
import { sequelize } from '../../src/common/database/mysql';
import { getSucursalId } from '../../src/common/request-context';
import { InventoryService } from '../../src/services/InventoryService';

const mockArticuloSucursal = ArticuloSucursal as jest.Mocked<typeof ArticuloSucursal>;
const mockQuery = (sequelize as any).query as jest.Mock;
let service: InventoryService;

beforeEach(() => {
  jest.clearAllMocks();
  (getSucursalId as jest.Mock).mockReturnValue(1);
  service = new InventoryService();
});

describe('getStock', () => {
  it('debe retornar stock de un articulo en sucursal activa', async () => {
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue({ get: () => ({ stock: 15 }) });
    const result = await service.getStock(1);
    expect(result).toBe(15);
    expect(mockArticuloSucursal.findOne).toHaveBeenCalledWith({
      where: { idarticulo: 1, idsucursal: 1 }
    });
  });

  it('debe retornar 0 si no existe registro', async () => {
    (mockArticuloSucursal.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.getStock(1);
    expect(result).toBe(0);
  });

  it('debe retornar 0 si no hay sucursal activa', async () => {
    (getSucursalId as jest.Mock).mockReturnValue(null);
    const result = await service.getStock(1);
    expect(result).toBe(0);
  });
});

describe('getStockAllSucursales', () => {
  it('debe retornar stock de todas las sucursales', async () => {
    (mockArticuloSucursal.findAll as jest.Mock).mockResolvedValue([
      { idsucursal: 1, stock: 10 },
      { idsucursal: 2, stock: 5 },
    ]);
    const result = await service.getStockAllSucursales(1);
    expect(result).toEqual([{ idsucursal: 1, stock: 10 }, { idsucursal: 2, stock: 5 }]);
  });
});

describe('setStock', () => {
  it('debe asignar stock inicial a un articulo', async () => {
    const mockRow = { update: jest.fn() };
    (mockArticuloSucursal.findOrCreate as jest.Mock).mockResolvedValue([mockRow, true]);
    await service.setStock(1, 20);
    expect(mockRow.update).toHaveBeenCalledWith({ stock: 20 });
  });

  it('debe lanzar error si no hay sucursal', async () => {
    (getSucursalId as jest.Mock).mockReturnValue(null);
    await expect(service.setStock(1, 20)).rejects.toThrow('Sucursal no seleccionada');
  });
});

describe('getLowStock', () => {
  it('debe retornar articulos con stock bajo', async () => {
    mockQuery.mockResolvedValue([{ idarticulo: 1, nombre: 'Art', stock: 3 }]);
    const result = await service.getLowStock(5);
    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(3);
  });
});

describe('getInventory', () => {
  it('debe retornar inventario completo de sucursal activa', async () => {
    mockQuery.mockResolvedValue([
      { idarticulo: 1, nombre: 'Art1', stock: 10, precio_venta: 100, categoria_nombre: 'Cat1' },
    ]);
    const result = await service.getInventory();
    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(10);
  });
});
