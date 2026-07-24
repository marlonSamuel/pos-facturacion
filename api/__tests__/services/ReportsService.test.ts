/**
 * ReportsService — Test Suite
 */
jest.mock('../../src/common/request-context', () => ({
  sucursalFilter: () => ({}),
  comercioFilter: () => ({ idcomercio: 1 }),
  getSucursalId: () => 1,
}));

const mockQuery = jest.fn();

jest.mock('../../src/common/database/mysql', () => ({
  sequelize: { query: (...args: any[]) => mockQuery(...args) },
}));

import { ReportsService } from '../../src/services/ReportsService';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService();
  });

  describe('getSales', () => {
    it('debe filtrar por estado Anulado', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getSales('2000-01-01', '2100-12-31', undefined, undefined, 'Anulado');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('v.estado = :estado');
      const replacements = mockQuery.mock.calls[0][1].replacements;
      expect(replacements.estado).toBe('Anulado');
    });

    it('debe filtrar por estado Activas (Aceptado/PendienteDTE)', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getSales('2000-01-01', '2100-12-31', undefined, undefined, 'Aceptado');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("v.estado = 'Aceptado'");
    });

    it('debe mostrar todas cuando estado es Todas', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getSales('2000-01-01', '2100-12-31', undefined, undefined, 'Todas');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("v.estado IN ('Aceptado','Anulado')");
    });

    it('debe retornar rows con motivo_anulacion', async () => {
      mockQuery.mockResolvedValue([
        { idventa: 1, estado: 'Anulado', motivo_anulacion: 'Prueba', total_venta: '100' }
      ]);
      const result = await service.getSales('2000-01-01', '2100-12-31');
      expect((result.rows[0] as any).motivo_anulacion).toBe('Prueba');
    });
  });

  describe('getPurchases', () => {
    it('debe filtrar por estado Anulado', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getPurchases('2000-01-01', '2100-12-31', undefined, 'Anulado');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('i.estado = :estado');
      const replacements = mockQuery.mock.calls[0][1].replacements;
      expect(replacements.estado).toBe('Anulado');
    });

    it('debe retornar motivo_anulacion', async () => {
      mockQuery.mockResolvedValue([
        { idingreso: 1, estado: 'Anulado', motivo_anulacion: 'Error en compra', total_compra: '200' }
      ]);
      const result = await service.getPurchases('2000-01-01', '2100-12-31');
      expect((result.rows[0] as any).motivo_anulacion).toBe('Error en compra');
    });
  });

  describe('getInventory', () => {
    it('debe filtrar articulos por idcomercio', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getInventory();
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('a.idcomercio = :idcomercio');
    });
  });

  describe('getDteInvoices', () => {
    it('debe filtrar DTE activas (estado=0)', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getDteInvoices('2000-01-01', '2100-12-31', undefined, 'Activas');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('sf.estado = 0');
    });

    it('debe filtrar DTE anuladas (estado=1)', async () => {
      mockQuery.mockResolvedValue([]);
      await service.getDteInvoices('2000-01-01', '2100-12-31', undefined, 'Anuladas');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('sf.estado = 1');
    });
  });
});
