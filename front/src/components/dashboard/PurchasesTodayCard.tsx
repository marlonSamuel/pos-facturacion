import { Card, Statistic, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const card = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' };

export const PurchasesTodayCard = () => {
  const { data, loading } = useDashboardData<{ total: number }>('purchases-today');

  return (
    <Card styles={{ body: { padding: 20 } }} style={card}>
      {loading ? <Spin /> : (
        <Statistic
          title="Compras Hoy"
          value={data?.total || 0}
          precision={2}
          prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
          suffix="Q"
          styles={{ content: { color: '#52c41a', fontWeight: 600, fontSize: 24 } }}
        />
      )}
    </Card>
  );
};
