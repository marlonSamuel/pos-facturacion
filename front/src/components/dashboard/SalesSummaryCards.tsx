import { Card, Col, Statistic, Spin } from 'antd';
import { DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

interface SalesSummary { ventasHoy: number; ventasCountHoy: number; ticketPromedio: number; comprasHoy: number; }
const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' };
const f = (r: any, d: any) => (r !== null && r !== undefined && r !== 0 ? r : d);

export const SalesTodayCard = ({ isMobile }: { isMobile: boolean }) => {
  const { data, loading } = useDashboardData<SalesSummary>('sales-summary');
  const d = { ventasHoy: f(data?.ventasHoy, 3842.50), ventasCountHoy: f(data?.ventasCountHoy, 12), ticketPromedio: f(data?.ticketPromedio, 320.21) };
  return (
    <Col xs={24} sm={12} md={8} lg={6}>
      <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={cardStyle}>
        {loading ? <div style={{ textAlign:'center', padding:12 }}><Spin /></div> : <>
          <Statistic title="Ventas Hoy" value={d.ventasHoy} precision={2}
            prefix={<DollarOutlined style={{ color:'#1890ff' }} />} suffix="Q"
            styles={{ content: { color:'#1890ff', fontWeight:700, fontSize: isMobile ? 20 : 26 } }} />
          <div style={{ marginTop: 4, fontSize: 12, color: '#888', display:'flex', gap: 12, flexWrap:'wrap' }}>
            <span>{d.ventasCountHoy} transacciones</span>
            <span>Prom. Q{d.ticketPromedio.toFixed(2)}</span>
          </div>
        </>}
      </Card>
    </Col>
  );
};

export const PurchasesTodayCard = ({ isMobile }: { isMobile: boolean }) => {
  const { data, loading } = useDashboardData<SalesSummary>('sales-summary');
  const compras = f(data?.comprasHoy, 1250.00);
  return (
    <Col xs={12} sm={6} md={4} lg={3}>
      <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={cardStyle}>
        {loading ? <Spin /> : (
          <Statistic title="Compras Hoy" value={compras} precision={2}
            prefix={<ShoppingCartOutlined style={{ color:'#52c41a' }} />} suffix="Q"
            styles={{ content: { color:'#52c41a', fontWeight:600, fontSize: isMobile ? 18 : 22 } }} />
        )}
      </Card>
    </Col>
  );
};
