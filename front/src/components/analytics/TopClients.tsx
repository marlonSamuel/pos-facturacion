import { Row, Col, Typography } from 'antd';

const { Text } = Typography;

interface Client {
  nombre: string;
  documento?: string;
  compras: number;
  total: number;
}

interface Props {
  data: Client[];
}

export const TopClients = ({ data }: Props) => {
  if (data.length === 0) return <Text type="secondary" style={{ padding: 16, display: 'block', textAlign: 'center' }}>Sin datos</Text>;
  return (
    <div>
      {data.map((c, i) => (
        <Row key={i} justify="space-between" align="middle" style={{ padding: '6px 12px', borderBottom: i < data.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
          <Col>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nombre}</div>
            {c.documento && <Text type="secondary" style={{ fontSize: 10 }}>{c.documento}</Text>}
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>Q{c.total.toFixed(2)}</div>
            <Text type="secondary" style={{ fontSize: 10 }}>{c.compras} compras</Text>
          </Col>
        </Row>
      ))}
    </div>
  );
};
