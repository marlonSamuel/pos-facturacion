import { Card, Spin, Row, Col, Typography } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const { Text } = Typography;

interface TopProduct { nombre: string; codigo: string; vendidos: number; total_vendido: number; }

export const TopProductsCard = () => {
  const { data, loading } = useDashboardData<TopProduct[]>('top-products');

  return (
    <Card title={<><RiseOutlined style={{ color: '#52c41a' }} /> Más vendidos hoy</>}
      size="small" styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div>
      ) : !data?.length ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Text type="secondary">Sin ventas hoy</Text></div>
      ) : (
        data.map((p: TopProduct, i: number) => (
          <Row key={p.codigo || i} align="middle" style={{ padding: '6px 12px', borderBottom: '1px solid #f5f5f5' }}>
            <Col flex="auto">
              <Text style={{ fontSize: 12 }}>{p.nombre}</Text>
              <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>×{p.vendidos}</Text>
            </Col>
            <Col><Text style={{ fontSize: 12, fontWeight: 600 }}>Q{Number(p.total_vendido).toFixed(2)}</Text></Col>
          </Row>
        ))
      )}
    </Card>
  );
};
