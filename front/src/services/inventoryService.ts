import api from '../api/axios';

export const inventoryService = {
  /**
   * Obtiene el stock de un artículo en la sucursal activa
   */
  async getStock(articuloId: number): Promise<number> {
    const r = await api.get<{ stock: number }>(`/inventory/stock/${articuloId}`);
    return r.data.stock;
  },

  /**
   * Obtiene artículos con stock bajo
   */
  async getLowStock(threshold = 5): Promise<any[]> {
    const r = await api.get<any[]>('/inventory/low-stock', {
      params: { threshold }
    });
    return r.data;
  }
};
