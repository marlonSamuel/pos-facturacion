/**
 * ArticleService — Test Suite
 */

jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  getSucursalId: () => 1,
  comercioFilter: () => ({}),
  getComercioId: () => 1,
}));

jest.mock('../../src/models', () => ({
  Articulo: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Categoria: {},
  DetalleIngreso: {},
  ArticuloSucursal: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  Sucursal: {},
}));

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: {
    query: jest.fn(),
    literal: jest.fn((val: string) => val),
    transaction: jest.fn(),
  },
}));

jest.mock('fs');
jest.mock('path');

import { Articulo } from '../../src/models';
import { sequelize } from '../../src/common/database/mysql';
import { ArticleService } from '../../src/services/ArticleService';
import fs from 'fs';

const mockArticulo = Articulo as jest.Mocked<typeof Articulo>;
const { ArticuloSucursal } = require('../../src/models');
const mockQuery = (sequelize as any).query as jest.Mock;
let service: ArticleService;

function mockRow(data: any, stock = 0): any {
  return {
    get: (opts?: any) => opts?.plain
      ? { ...data, inventario: [{ stock }] }
      : { ...data, inventario: [{ stock }] }
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  service = new ArticleService();
});

describe('getAll', () => {
  it('debe retornar articulos activos con categoria y stock', async () => {
    const articles = [mockRow({ idarticulo: 1, nombre: 'Art1', condicion: 1 }, 10)];
    (mockArticulo.findAll as jest.Mock).mockResolvedValue(articles);
    const result = await service.getAll();
    expect(result).toEqual([{ idarticulo: 1, nombre: 'Art1', condicion: 1, stock: 10 }]);
    expect(mockArticulo.findAll).toHaveBeenCalledWith({
      where: { condicion: 1 },
      include: expect.arrayContaining([
        expect.objectContaining({ as: 'categoria' }),
        expect.objectContaining({ as: 'inventario' }),
      ]),
    });
  });
});

describe('getAllPaginated', () => {
  it('debe retornar articulos paginados con stock', async () => {
    const allRows = Array.from({ length: 50 }, (_, i) => mockRow({ idarticulo: i + 1, nombre: 'Art ' + (i + 1) }, i + 1));
    (mockArticulo.findAndCountAll as jest.Mock).mockResolvedValue({ rows: allRows.slice(0, 10), count: 50 });
    const result = await service.getAllPaginated(1, 10);
    expect(result.rows).toHaveLength(10);
    expect(result.rows[0].stock).toBe(1);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(5);
  });

  it('debe incluir inactivos si includeInactive=true', async () => {
    (mockArticulo.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
    await service.getAllPaginated(1, 10, true);
    const callArgs = (mockArticulo.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.condicion).toBeUndefined();
  });
});

describe('search', () => {
  it('debe buscar articulos por nombre o codigo', async () => {
    const rows = [mockRow({ idarticulo: 1, nombre: 'Coca Cola' }, 5)];
    (mockArticulo.findAndCountAll as jest.Mock).mockResolvedValue({ rows, count: 1 });
    (ArticuloSucursal.findAll as jest.Mock).mockResolvedValue([]);
    const result = await service.search('coca', 20, 0);
    expect(result.rows).toEqual([{ idarticulo: 1, nombre: 'Coca Cola', stock: 5, stockPorSucursal: [] }]);
    expect(result.total).toBe(1);
  });

  it('debe retornar vacio si no hay coincidencias', async () => {
    (mockArticulo.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
    const result = await service.search('xyz', 20, 0);
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('debe filtrar por categoria si se especifica', async () => {
    (mockArticulo.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
    await service.search('', 20, 0, 5);
    const callArgs = (mockArticulo.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.idcategoria).toBe(5);
  });
});

describe('getLastPurchasePrice', () => {
  it('debe retornar ultimo precio de compra', async () => {
    mockQuery.mockResolvedValue([{ precio_compra: 50, precio_venta: 75 }]);
    const result = await service.getLastPurchasePrice(1);
    expect(result).toEqual({ precio_compra: 50, precio_venta: null });
  });

  it('debe retornar null si no hay compras previas', async () => {
    mockQuery.mockResolvedValue([{ precio_compra: null, precio_venta: null }]);
    const result = await service.getLastPurchasePrice(1);
    expect(result).toEqual({ precio_compra: null, precio_venta: null });
  });
});

describe('getById', () => {
  it('debe retornar articulo por ID con stock', async () => {
    (mockArticulo.findOne as jest.Mock).mockResolvedValue(mockRow({ idarticulo: 1, nombre: 'Art' }, 8));
    const result = await service.getById(1);
    expect(result.idarticulo).toBe(1);
    expect(result.stock).toBe(8);
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockArticulo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow('Articulo no encontrado');
  });
});

describe('create', () => {
  const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

  beforeEach(() => {
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  it('debe crear articulo sin imagen', async () => {
    const data = { nombre: 'Nuevo', idcategoria: 1, codigo: '123', precio_venta: 50 };
    (mockArticulo.create as jest.Mock).mockResolvedValue({ idarticulo: 1, ...data });
    await service.create(data as any);
    expect(mockArticulo.create).toHaveBeenCalledWith(
      { idcomercio: 1, ...data },
      expect.objectContaining({})
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe crear articulo con imagen', async () => {
    const data = { nombre: 'Nuevo', idcategoria: 1, precio_venta: 50 };
    (mockArticulo.create as jest.Mock).mockResolvedValue({ idarticulo: 1, ...data, imagen: 'foto.jpg' });
    await service.create(data as any, 'foto.jpg');
    expect(mockArticulo.create).toHaveBeenCalledWith(
      { idcomercio: 1, ...data, imagen: 'foto.jpg' },
      expect.objectContaining({})
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe eliminar stock del payload si se envia', async () => {
    const data = { nombre: 'Nuevo', idcategoria: 1, stock: 99, precio_venta: 50 };
    (mockArticulo.create as jest.Mock).mockResolvedValue({ idarticulo: 1, ...data });
    await service.create(data as any);
    const callArg = (mockArticulo.create as jest.Mock).mock.calls[0][0];
    expect(callArg.stock).toBeUndefined();
    expect(callArg.idcomercio).toBe(1);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('debe hacer rollback si falla la creacion de stock', async () => {
    const data = { nombre: 'Nuevo', idcategoria: 1, precio_venta: 50, stock: 10 };
    (mockArticulo.create as jest.Mock).mockResolvedValue({ idarticulo: 1, ...data });
    (ArticuloSucursal.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    await expect(service.create(data as any)).rejects.toThrow('DB error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });
});

describe('delete', () => {
  it('debe eliminar articulo y su imagen', async () => {
    (mockArticulo.findOne as jest.Mock).mockResolvedValue({
      get: () => ({ imagen: 'old.jpg' }),
      destroy: jest.fn().mockResolvedValue(undefined),
    } as any);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    // path.join es un mock automático, retorna undefined — validamos que se intente eliminar
    await service.delete(1);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('debe lanzar 404 si no existe', async () => {
    (mockArticulo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.delete(999)).rejects.toThrow('Articulo no encontrado');
  });
});
