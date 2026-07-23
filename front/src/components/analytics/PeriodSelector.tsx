import { Row, Col, Select, DatePicker } from 'antd';
import { useState } from 'react';

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'this-week', label: 'Esta semana' },
  { value: 'last-week', label: 'Semana anterior' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'last-month', label: 'Mes anterior' },
  { value: 'this-quarter', label: 'Este trimestre' },
  { value: 'this-year', label: 'Este año' },
  { value: 'custom', label: 'Rango' },
];

interface Props {
  period: string;
  dateRange: [string, string];
  onPeriodChange: (period: string, range: [string, string]) => void;
}

export const PeriodSelector = ({ period, dateRange, onPeriodChange }: Props) => {
  const [tempRange, setTempRange] = useState<[string, string]>(dateRange);

  return (
    <Row gutter={[8, 8]} align="middle">
      <Col>
        <Select
          value={period}
          onChange={v => {
            if (v !== 'custom') onPeriodChange(v, ['', '']);
            else onPeriodChange(v, tempRange);
          }}
          size="small"
          style={{ width: 160 }}
          options={PERIODS}
        />
      </Col>
      {period === 'custom' && (
        <Col>
          <DatePicker.RangePicker
            onChange={(_, ds) => {
              if (ds[0] && ds[1]) {
                const diff = new Date(ds[1]).getTime() - new Date(ds[0]).getTime();
                if (diff > 365 * 24 * 60 * 60 * 1000) return;
              }
              const r: [string, string] = [ds[0] || '', ds[1] || ''];
              setTempRange(r);
              onPeriodChange('custom', r);
            }}
            size="small"
          />
        </Col>
      )}
    </Row>
  );
};
