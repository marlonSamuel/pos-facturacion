import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Tag } from 'antd';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from 'recharts';
import { PeriodSelector } from '../../components/analytics/PeriodSelector';
import { AnalyticsKPIs } from '../../components/analytics/AnalyticsKPIs';
import { DailyComparisonChart } from '../../components/analytics/DailyComparisonChart';
import { DayOfWeekChart } from '../../components/analytics/DayOfWeekChart';
import { TopClients } from '../../components/analytics/TopClients';
import { CategoryBreakdown } from '../../components/analytics/CategoryBreakdown';
import api from '../../api/axios';

const { Title, Text } = Typography;
const f = (v: number) => `Q${v.toFixed(2)}`;

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('this-month');
  const [overview, setOverview] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByType, setSalesByType] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [dailyComp, setDailyComp] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  const fetchAll = async (p: string, _r: [string, string]) => {
    try {
      const params = new URLSearchParams({ period: p });
      if (p === 'custom' && _r[0]) { params.set('from', _r[0]); params.set('to', _r[1]); }
      const qs = `?${params.toString()}`;
      const [
        ov, dl, tp, sbt, cat, dow, mt, tc, dc, hr,
      ] = await Promise.all([
        api.get(`/analytics/overview${qs}`),
        api.get(`/analytics/daily${qs}`),
        api.get(`/analytics/top-products${qs}`),
        api.get(`/analytics/sales-by-type${qs}`),
        api.get(`/analytics/category-breakdown${qs}`),
        api.get(`/analytics/day-of-week${qs}`),
        api.get(`/analytics/monthly-trend${qs}`),
        api.get(`/analytics/top-clients${qs}`),
        api.get(`/analytics/daily-comparison${qs}`),
        api.get(`/analytics/hourly${qs}`),
      ]);
      setOverview(ov.data);
      setDaily(dl.data || []);
      setTopProducts(tp.data || []);
      setSalesByType(sbt.data || []);
      setCategoryData(cat.data || []);
      setDayOfWeek(dow.data || []);
      setMonthlyTrend(mt.data || []);
      setTopClients(tc.data || []);
      setDailyComp(dc.data || []);
      setHourlyData(hr.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchAll(period, ['', '']); }, [period]);

  const handlePeriodChange = (p: string, r: [string, string]) => {
    setPeriod(p);
    fetchAll(p, r);
  };

  const kpiItems = overview ? [
    { label: 'Ventas', value: f(overview.current.totalVentas), cambio: overview.comparacion.ventas.cambio, subtitle: `${overview.current.documentos} docs` },
    { label: 'Compras', value: f(overview.current.totalCompras), cambio: overview.comparacion.compras.cambio, subtitle: `${overview.current.comprasCount} docs` },
    { label: 'Ganancia', value: f(overview.current.ganancia), cambio: overview.comparacion.ganancia.cambio, subtitle: `${overview.current.totalVentas > 0 ? ((overview.current.ganancia / overview.current.totalVentas) * 100).toFixed(1) : 0}% margen` },
    { label: 'Documentos', value: String(overview.current.documentos), cambio: overview.comparacion.documentos.cambio, subtitle: `${overview.current.dteCount} DTE` },
    { label: 'IVA Facturas', value: f(overview.current.ivaFacturas), subtitle: `${overview.current.facturas} facturas` },
  ] : [];

  const TIPOS_COLOR: Record<string, string> = { Factura: '#1677ff', Ticket: '#52c41a', Boleta: '#faad14' };
  const chartCard = { body: { padding: '8px 4px' } };

  const isLongPeriod = ['this-year', 'last-year'].includes(period);
  const trendData = isLongPeriod ? monthlyTrend : daily;
  const trendLabel = isLongPeriod ? 'Tendencia Mensual' : 'Tendencia Diaria';
  const trendKeyX = isLongPeriod ? 'mes' : 'dia';
  const trendTickFormatter = isLongPeriod ? (v: string) => v?.slice(5) || '' : (v: string) => v?.slice(5) || '';

  return (
    <div style={{ padding: '0 4px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>Analíticas</Title></Col>
        <Col><PeriodSelector period={period} dateRange={['', '']} onPeriodChange={handlePeriodChange} /></Col>
      </Row>

      {/* ── KPI Cards ── */}
      <div style={{ marginBottom: 16 }}><AnalyticsKPIs items={kpiItems} /></div>

      {/* ── Row 1: Daily Trend + Top Products + Type ── */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Card size="small" title={trendLabel} styles={chartCard}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey={trendKeyX} tick={{ fontSize: 10 }} tickFormatter={trendTickFormatter} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [f(value), 'Ventas']} />
                  <Bar dataKey="ventas" fill="#1677ff" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" title="Top Productos" styles={{ body: { padding: 0 } }} style={{ marginBottom: 12 }}>
            <MiniProductTable data={topProducts} f={f} />
          </Card>
          <Card size="small" title="Por Tipo" styles={{ body: { padding: '8px 12px' } }}>
            {salesByType.map((s: any, i: number) => (
              <Row key={i} justify="space-between" style={{ padding: '4px 0', borderBottom: i < salesByType.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <Col><Tag color={TIPOS_COLOR[s.tipo] || '#999'}>{s.tipo}</Tag></Col>
                <Col style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f(s.total)}</div>
                  <Text type="secondary" style={{ fontSize: 10 }}>{s.documentos} docs</Text>
                </Col>
              </Row>
            ))}
            {salesByType.length === 0 && <EmptyText />}
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" title="Top Clientes" styles={{ body: { padding: '8px 0' } }} style={{ marginBottom: 12 }}>
            <TopClients data={topClients} />
          </Card>
        </Col>
      </Row>

      {/* ── Row 2: Day-of-week + Category + Hourly ── */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Card size="small" title="Ventas por Día de la Semana" styles={chartCard}>
            {dayOfWeek.length > 0 ? <DayOfWeekChart data={dayOfWeek} /> : <EmptyState />}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="Ventas por Categoría" styles={{ body: { padding: '4px 0' } }}>
            <CategoryBreakdown data={categoryData} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="Ventas por Hora" styles={chartCard}>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [f(value), 'Ventas']} />
                  <Bar dataKey="ventas" fill="#722ed1" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </Card>
        </Col>
      </Row>

      {/* ── Row 3: Daily Comparison + Monthly Trend ── */}
      <Row gutter={12}>
        <Col span={12}>
          <Card size="small" title="Comparación Día a Día vs Período Anterior" styles={chartCard}>
            {dailyComp.length > 0 ? <DailyComparisonChart data={dailyComp} /> : <EmptyState />}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Tendencia Mensual" styles={chartCard}>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any, name: any) => [f(value), name === 'ventas' ? 'Ventas' : 'Compras']} />
                  <Line type="monotone" dataKey="ventas" stroke="#1677ff" strokeWidth={2} dot={{ r: 3 }} name="ventas" />
                  <Line type="monotone" dataKey="compras" stroke="#52c41a" strokeWidth={2} dot={{ r: 3 }} name="compras" />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const EmptyState = () => <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Sin datos en este período</div>;
const EmptyText = () => <Text type="secondary" style={{ display: 'block', padding: 8, textAlign: 'center' }}>Sin datos</Text>;

const MiniProductTable = ({ data, f: fmt }: { data: any[]; f: (v: number) => string }) => (
  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
    <thead>
      <tr style={{ background: '#fafafa' }}>
        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Producto</th>
        <th style={{ padding: '6px 8px', textAlign: 'center', width: 40 }}>Cant</th>
        <th style={{ padding: '6px 8px', textAlign: 'right', width: 65 }}>Total</th>
      </tr>
    </thead>
    <tbody>
      {data.slice(0, 5).map((p: any, i: number) => (
        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
          <td style={{ padding: '4px 8px' }}>{p.nombre}</td>
          <td style={{ padding: '4px 8px', textAlign: 'center' }}>{p.cantidad}</td>
          <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(p.total)}</td>
        </tr>
      ))}
      {data.length === 0 && <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#999' }}>Sin datos</td></tr>}
    </tbody>
  </table>
);

export default AnalyticsPage;
export { AnalyticsPage };
