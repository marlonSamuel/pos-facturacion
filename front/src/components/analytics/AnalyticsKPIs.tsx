import { Row, Col, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface KpiItem {
  label: string;
  value: string;
  subtitle?: string;
  cambio?: number;
  prefix?: string;
}

interface Props {
  items: KpiItem[];
}

export const AnalyticsKPIs = ({ items }: Props) => {
  const cardStyle: React.CSSProperties = {
    background: '#fafafa',
    borderRadius: 8,
    padding: '14px 18px',
    textAlign: 'center',
    height: '100%',
  };

  return (
    <Row gutter={[12, 12]}>
      {items.map((item, i) => (
        <Col span={Math.floor(24 / items.length)} key={i}>
          <div style={cardStyle}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.label}
            </Text>
            <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>{item.value}</div>
            {item.cambio !== undefined && (
              <div style={{ fontSize: 12 }}>
                {item.cambio > 0 ? (
                  <span style={{ color: '#52c41a' }}><ArrowUpOutlined /> {item.cambio.toFixed(1)}%</span>
                ) : item.cambio < 0 ? (
                  <span style={{ color: '#ff4d4f' }}><ArrowDownOutlined /> {Math.abs(item.cambio).toFixed(1)}%</span>
                ) : (
                  <span style={{ color: '#8c8c8c' }}><MinusOutlined /> 0%</span>
                )}
                <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>vs período anterior</Text>
              </div>
            )}
            {item.subtitle && !item.cambio && (
              <Text type="secondary" style={{ fontSize: 10 }}>{item.subtitle}</Text>
            )}
          </div>
        </Col>
      ))}
    </Row>
  );
};
