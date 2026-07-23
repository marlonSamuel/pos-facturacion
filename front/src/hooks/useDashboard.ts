import { useState, useContext } from 'react';
import api from '../api/axios';
import { UIContext } from '../context/UIContext';

export interface DashboardData {
  ventasHoy: number;
  comprasHoy: number;
  ventasCountHoy: number;
  ticketPromedio: number;
  facturas: {
    activas: number;
    anuladas: number;
    total: number;
    impuesto: number;
  };
  ventasMeses: { mes: string; total: number; cantidad: number }[];
  comprasVsVentas: { mes: number; anio: number; total_venta: number; total_compra: number }[];
  totalClientes: number;
  totalProveedores: number;
  totalArticulos: number;
  stockBajo: { idarticulo: number; nombre: string; codigo: string; stock: number }[];
  ventasRecientes: { idventa: number; serie_comprobante: string; num_comprobante: string; tipo_comprobante: string; total_venta: number; fecha_hora: string; cliente: string }[];
  productosTop: { nombre: string; codigo: string; vendidos: number; total_vendido: number }[];
}

export const useDashboard = () => {
  const { setLoading } = useContext(UIContext);
  const [data, setData] = useState<DashboardData | null>(null);

  const getSummary = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ ok: boolean; data: DashboardData }>('/dashboard/summary');
      setData(r.data.data);
    } catch {
      // Si falla, los datos se quedan como están
    }
    setLoading(false);
  };

  return { data, getSummary };
};
