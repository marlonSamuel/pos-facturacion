/**
 * DashboardService — Test Suite
 */
jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({ idsucursal: 1 }),
  comercioFilter: () => ({ idcomercio: 1 }),
  getSucursalId: () => 1,
}));

const mockQuery = jest.fn();
jest.mock('../../src/common/database/mysql', () => ({
  sequelize: { query: (...args: any[]) => mockQuery(...args) },
}));

import { DashboardService } from '../../src/services/DashboardService';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe('getCatalog', () => {
    it('debe filtrar clientes por idcomercio', async () => {
      mockQuery.mockResolvedValue([{ total: 5 }]);
      await service.getCatalog();
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('idcomercio = :idcomercio');
    });

    it('debe filtrar proveedores por idcomercio', async () => {
      mockQuery.mockResolvedValue([{ total: 3 }]);
      await service.getCatalog();
      const sql = mockQuery.mock.calls[1][0] as string;
      expect(sql).toContain('idcomercio = :idcomercio');
    });

    it('debe filtrar articulos por idcomercio', async () => {
      mockQuery.mockResolvedValue([{ total: 10 }]);
      await service.getCatalog();
      const sql = mockQuery.mock.calls[2][0] as string;
      expect(sql).toContain('idcomercio = :idcomercio');
    });
  });
});
