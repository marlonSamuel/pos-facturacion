import { Card, Spin, Row, Col, Tag, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const { Text } = Typography;

interface RecentSale {
  idventa: number; serie_comprobante: string; num_comprobante: string;
  tipo_comprobante: string; total_venta: number; fecha_hora: string; cliente: string;
}

const tagColor: Record<string, string> = { Factura: 'purple', Ticket: 'blue', Boleta: 'cyan' };

export const RecentSalesCard = () => {
  const { data, loading } = useDashboardData<RecentSale[]>('recent-sales');

  return (
    <Card title={<><ShoppingCartOutlined style={{ color: '#722ed1' }} /> Últimas ventas</>}
      size="small" styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div>
      ) : !data?.length ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Text type="secondary">Sin ventas recientes</Text></div>
      ) : (
        data.map((v: RecentSale) => (
          <Row key={v.idventa} align="middle" style={{ padding: '6px 12px', borderBottom: '1px solid #f5f5f5' }}>
            <Col flex="auto">
              <Text style={{ fontSize: 12 }}>{v.cliente || 'Consumidor Final'}</Text>
              <div>
                <Tag color={tagColor[v.tipo_comprobante] || 'default'} style={{ fontSize: 9, lineHeight: '14px' }}>
                  {v.tipo_comprobante}
                </Tag>
                <Text type="secondary" style={{ fontSize: 10 }}> {v.serie_comprobante || ''}{v.num_comprobante || ''}</Text>
              </div>
            </Col>
            <Col><Text style={{ fontSize: 12, fontWeight: 600 }}>Q{Number(v.total_venta).toFixed(2)}</Text></Col>
          </Row>
        ))
      )}
    </Card>
  );
};
