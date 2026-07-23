import { Row, Col, Tag, Typography } from 'antd';

const { Text } = Typography;

interface Cat {
  categoria: string;
  cantidad: number;
  total: number;
}

interface Props {
  data: Cat[];
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#ff4d4f', '#13c2c2', '#eb2f96', '#2f54eb'];

export const CategoryBreakdown = ({ data }: Props) => {
  if (data.length === 0) return <Text type="secondary" style={{ padding: 16, display: 'block', textAlign: 'center' }}>Sin datos</Text>;
  const total = data.reduce((s, c) => s + c.total, 0);
  return (
    <div>
      {data.slice(0, 6).map((c, i) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        return (
          <Row key={i} justify="space-between" align="middle" style={{ padding: '5px 12px' }}>
            <Col flex="auto">
              <Tag color={COLORS[i % COLORS.length]} style={{ fontSize: 11 }}>{c.categoria}</Tag>
            </Col>
            <Col style={{ textAlign: 'right', width: 80 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>Q{c.total.toFixed(2)}</div>
            </Col>
            <Col style={{ textAlign: 'right', width: 50 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{pct.toFixed(1)}%</Text>
            </Col>
          </Row>
        );
      })}
      {data.length > 6 && (
        <Row justify="center" style={{ padding: 4 }}><Text type="secondary" style={{ fontSize: 10 }}>+{data.length - 6} más</Text></Row>
      )}
    </div>
  );
};
