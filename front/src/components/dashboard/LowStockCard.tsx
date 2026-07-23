import { Card, Spin, Row, Col, Tag, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const { Text } = Typography;

interface StockItem { idarticulo: number; nombre: string; codigo: string; stock: number; }

export const LowStockCard = () => {
  const { data, loading } = useDashboardData<StockItem[]>('low-stock');

  return (
    <Card title={<><WarningOutlined style={{ color: '#faad14' }} /> Stock Bajo</>}
      size="small" styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
      ) : !data?.length ? (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Text type="secondary">✅ Todos los productos con stock suficiente</Text>
        </div>
      ) : (
        <div style={{ maxHeight: 110 }}>
          {data.map((p: StockItem) => (
            <Row key={p.idarticulo} align="middle" style={{ padding: '4px 12px', borderBottom: '1px solid #f5f5f5' }}>
              <Col flex="auto">
                <Text style={{ fontSize: 12 }}>{p.nombre}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>{p.codigo}</Text>
              </Col>
              <Col>
                <Tag color={p.stock === 0 ? 'red' : 'orange'} style={{ fontSize: 11 }}>{p.stock} und.</Tag>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </Card>
  );
};
