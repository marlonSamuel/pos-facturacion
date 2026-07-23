import { Card, Spin, Typography } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const { Text } = Typography;
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface MonthSale { mes: string; total: number; cantidad: number; }

export const MonthlySalesChart = () => {
  const { data, loading } = useDashboardData<MonthSale[]>('monthly-sales');
  const maxVenta = data?.length ? Math.max(...data.map(v => Number(v.total)), 1) : 1;

  return (
    <Card title={<><RiseOutlined style={{ color: '#1890ff' }} /> Ventas Mensuales</>}
      size="small" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div>
      ) : !data?.length ? (
        <div style={{ textAlign: 'center', padding: 16 }}><Text type="secondary">Sin datos de ventas</Text></div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, padding: '8px 0' }}>
          {[...data].reverse().map((v: MonthSale) => {
            const pct = (Number(v.total) / maxVenta) * 100;
            const [, m] = v.mes.split('-');
            return (
              <div key={v.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 8, whiteSpace: 'nowrap' }}>Q{Number(v.total).toFixed(0)}</Text>
                <div style={{
                  width: '100%', maxWidth: 28, height: `${Math.max(pct, 4)}%`,
                  background: 'linear-gradient(180deg, #1890ff, #40a9ff)',
                  borderRadius: '4px 4px 0 0', transition: 'height 0.3s', minHeight: 6
                }} />
                <Text style={{ fontSize: 8, marginTop: 2, color: '#888' }}>{MONTHS[parseInt(m) - 1]}</Text>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
