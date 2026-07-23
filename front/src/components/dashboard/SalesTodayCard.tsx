import { Card, Statistic, Spin } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const card = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' };

export const SalesTodayCard = () => {
  const { data, loading } = useDashboardData<{ total: number; cantidad: number; promedio: number }>('sales-today');

  return (
    <Card styles={{ body: { padding: 20 } }} style={card}>
      {loading ? <Spin /> : (
        <Statistic
          title="Ventas Hoy"
          value={data?.total || 0}
          precision={2}
          prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
          suffix="Q"
          styles={{ content: { color: '#1890ff', fontWeight: 600, fontSize: 24 } }}
        />
      )}
      {!loading && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
          {data?.cantidad || 0} transacción(es) · Ticket prom. Q{(data?.promedio || 0).toFixed(2)}
        </div>
      )}
    </Card>
  );
};
