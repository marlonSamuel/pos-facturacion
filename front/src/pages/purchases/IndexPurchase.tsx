import { useEffect, useState } from 'react';
import { Typography, Select, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { PurchaseList } from './PurchaseList';
import { PurchaseDetail } from './PurchaseDetail';
import { usePurchase } from '../../hooks/usePurchase';
import type { IPurchase } from '../../interfaces/IPurchase';

const { Title } = Typography;

export const IndexPurchase = () => {
  const { items, loading, detailLoading, total, page, pageSize, getAllPaginated, getById, cancel, estadoFilter, setEstadoFilter } = usePurchase();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<IPurchase | null>(null);

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
      <Title level={3} style={{ marginBottom: 16 }}><ShoppingCartOutlined /> Compras</Title>
      <Space style={{ marginBottom: 12 }}>
        <Select value={estadoFilter} onChange={handleEstadoChange} style={{ width: 160 }}>
          <Select.Option value="Todas">Todas</Select.Option>
          <Select.Option value="Aceptado">Activas</Select.Option>
          <Select.Option value="Anulado">Anuladas</Select.Option>
        </Select>
      </Space>
      <PurchaseList items={items} loading={loading} total={total} page={page} pageSize={pageSize} onPageChange={(p, ps) => getAllPaginated(p, ps, estadoFilter)} onView={handleView} onCancel={handleCancel} />
      <PurchaseDetail
        open={detailOpen}
        data={detailData}
        loading={detailLoading}
        onCancel={() => { setDetailOpen(false); setDetailData(null); }}
      />
    </div>
  );
};
