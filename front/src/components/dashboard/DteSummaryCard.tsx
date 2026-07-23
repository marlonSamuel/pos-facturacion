import { Card, Statistic, Spin, Typography } from 'antd';
import { FileTextOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons';
import { useDashboardData } from './useDashboardData';

const { Text } = Typography;
const card = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' };

interface DteData {
  activas: number; anuladas: number; total: number; impuesto: number;
}

export const DteSummaryCard = () => {
  const { data, loading } = useDashboardData<DteData>('dte-summary');

  return (
    <Card styles={{ body: { padding: 20 } }} style={card}>
      {loading ? <Spin /> : (
        <>
          <Statistic
            title="Facturas DTE (este mes)"
            value={data?.activas || 0}
            prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
            suffix={<Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>/ {data?.anuladas || 0} anuladas</Text>}
            styles={{ content: { color: '#722ed1', fontWeight: 600, fontSize: 24 } }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
            <span><DollarOutlined /> Facturado: <b>Q{(data?.total || 0).toFixed(2)}</b></span>
            <span><WarningOutlined style={{ color: '#cf1322' }} /> IVA: <b>Q{(data?.impuesto || 0).toFixed(2)}</b></span>
          </div>
        </>
      )}
    </Card>
  );
};
