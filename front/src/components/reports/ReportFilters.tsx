import { useState } from 'react';
import { Row, Col, DatePicker, Select, Button, InputNumber } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

interface Props {
  showDate?: boolean;
  showClient?: boolean;
  showProvider?: boolean;
  showThreshold?: boolean;
  showYear?: boolean;
  showType?: boolean;
  showCategory?: boolean;
  showStockGt?: boolean;
  showEstado?: boolean;

  clients?: { value: number; label: string }[];
  providers?: { value: number; label: string }[];
  categories?: { value: number; label: string }[];
  onSearch: (filters: Record<string, any>) => void;
  year?: number;
  threshold?: number;
}

export const ReportFilters = ({
  showDate, showClient, showProvider, showThreshold, showYear, showType, showCategory, showStockGt, showEstado,
  clients, providers, categories, onSearch, year: y, threshold: t,
}: Props) => {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [cliente, setCliente] = useState<number | undefined>();
  const [proveedor, setProveedor] = useState<number | undefined>();
  const [threshold, setThreshold] = useState(t ?? 5);
  const [year, setYear] = useState(y ?? new Date().getFullYear());
  const [tipo, setTipo] = useState<string | undefined>();
  const [categoria, setCategoria] = useState<number | undefined>();
  const [stockGt, setStockGt] = useState<number>(0);
  const [estado, setEstado] = useState<string>('Aceptado');

  const TIPOS = [
    { value: 'Factura', label: 'Factura' },
    { value: 'Ticket', label: 'Ticket' },
    { value: 'Boleta', label: 'Boleta' },
  ];

  return (
    <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
      {showDate && (
        <Col><RangePicker onChange={(_, ds) => setDateRange([ds[0] || '', ds[1] || ''])} size="small" /></Col>
      )}
      {showClient && clients && (
        <Col>
          <Select allowClear placeholder="Cliente" onChange={v => setCliente(v)} size="small" style={{ minWidth: 180 }}
            options={clients} />
        </Col>
      )}
      {showProvider && providers && (
        <Col>
          <Select allowClear placeholder="Proveedor" onChange={v => setProveedor(v)} size="small" style={{ minWidth: 180 }}
            options={providers} />
        </Col>
      )}
      {showType && (
        <Col>
          <Select allowClear placeholder="Tipo" onChange={v => setTipo(v)} size="small" style={{ width: 120 }} options={TIPOS} />
        </Col>
      )}
      {showCategory && categories && (
        <Col>
          <Select allowClear placeholder="Categoría" onChange={v => setCategoria(v)} size="small" style={{ minWidth: 160 }} options={categories} />
        </Col>
      )}
      {showThreshold && (
        <Col>
          <InputNumber min={1} max={100} defaultValue={threshold} onChange={v => setThreshold(v || 5)} size="small" addonBefore="Stock ≤" />
        </Col>
      )}
      {showStockGt && (
        <Col>
          <InputNumber min={0} max={999999} defaultValue={0} onChange={v => setStockGt(v ?? 0)} size="small" addonBefore="Stock >=" />
        </Col>
      )}
      {showYear && (
        <Col>
          <Select defaultValue={year} onChange={v => setYear(v)} size="small" style={{ width: 100 }}
            options={Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - 2 + i, label: String(new Date().getFullYear() - 2 + i) }))} />
        </Col>
      )}
      {showEstado && (
        <Col>
          <Select allowClear placeholder="Estado" defaultValue="Aceptado" onChange={v => setEstado(v)} size="small" style={{ width: 130 }}>
            <Select.Option value="Todas">Todas</Select.Option>
            <Select.Option value="Aceptado">Activas</Select.Option>
            <Select.Option value="Anulado">Anuladas</Select.Option>
          </Select>
        </Col>
      )}
      <Col>
        <Button icon={<SearchOutlined />} onClick={() => onSearch({ from: dateRange[0], to: dateRange[1], cliente, proveedor, tipo, categoria, stockGt, threshold, year, estado })} size="small" type="primary">
          Buscar
        </Button>
      </Col>
    </Row>
  );
};
