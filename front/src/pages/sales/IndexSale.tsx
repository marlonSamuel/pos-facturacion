import { useEffect, useState } from 'react';
import { Typography, Select, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { SaleList } from './SaleList';
import { SaleDetail } from './SaleDetail';
import { useSale } from '../../hooks/useSale';

const { Title } = Typography;

export const IndexSale = () => {
  const { items, loading, total, page, pageSize, getAllPaginated, getById, cancel, estadoFilter, setEstadoFilter } = useSale();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => { getAllPaginated(1, 10, estadoFilter); }, []);

  const handleView = async (id: number) => {
    setDetailOpen(true);
    const data = await getById(id);
    setDetailData(data);
  };

  const handleCancel = async (id: number, motivo?: string) => {
    await cancel(id, motivo);
  };

  const handleEstadoChange = (value: string) => {
    setEstadoFilter(value);
    getAllPaginated(1, pageSize, value);
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}><ShoppingCartOutlined /> Ventas</Title>
      <Space style={{ marginBottom: 12 }}>
        <Select value={estadoFilter} onChange={handleEstadoChange} style={{ width: 160 }}>
          <Select.Option value="Todas">Todas</Select.Option>
          <Select.Option value="Aceptado">Activas</Select.Option>
          <Select.Option value="Anulado">Anuladas</Select.Option>
        </Select>
      </Space>
      <SaleList items={items} loading={loading} total={total} page={page} pageSize={pageSize} onPageChange={(p, ps) => getAllPaginated(p, ps, estadoFilter)} onView={handleView} onCancel={handleCancel} />
      <SaleDetail
        open={detailOpen}
        saleId={detailData?.idventa || null}
        onClose={() => { setDetailOpen(false); setDetailData(null); }}
      />
    </div>
  );
};
