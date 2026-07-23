import { useEffect, useState, useContext } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography, Grid, Tag } from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, FileTextOutlined,
  WarningOutlined, TeamOutlined, AppstoreOutlined,
  ShoppingOutlined, RiseOutlined, PieChartOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/axios';
import { AuthContext } from '../../context/auth/AuthContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const COLORS = ['#1890ff','#52c41a','#722ed1','#faad14','#ff4d4f','#13c2c2'];
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function useEP<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let dead = false;
    setLoading(true);
    api.get<T>(`/dashboard/${endpoint}`).then(r => { if (!dead) setData(r.data); }).catch(() => { if (!dead) setData(null); }).finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [endpoint]);
  return { data, loading };
}

interface SalesSummary { ventasHoy: number; ventasCountHoy: number; ticketPromedio: number; comprasHoy: number; }
interface DteSummary { activas: number; anuladas: number; total: number; impuesto: number; }
interface StockItem { idarticulo: number; nombre: string; codigo: string; stock: number; }
interface CatalogData { clientes: number; proveedores: number; articulos: number; stockBajo: StockItem[]; }
interface SalesByType { tipo_comprobante: string; cantidad: number; total: number; }
interface TrendsData { ventasMeses: any[]; productosTop: any[]; ventasRecientes: any[]; salesByType: SalesByType[]; comprasMes: number; gananciaMes: number; }

const card = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' };

const DashboardPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const sales = useEP<SalesSummary>('sales-summary');
  const dte = useEP<DteSummary>('dte-summary');
  const catalog = useEP<CatalogData>('catalog');
  const trends = useEP<TrendsData>('trends');
  const q = (v: any) => `Q${Number(v).toFixed(2)}`;
  const tc: Record<string, string> = { Factura: 'purple', Ticket: 'blue', Boleta: 'cyan' };
  const s = sales.data; const d = dte.data; const c = catalog.data; const t = trends.data;
  const ventasMes = Number(t?.ventasMeses?.[0]?.total || 0);
  const gananciaMes = t?.gananciaMes ?? (ventasMes * 0.25);
  const meses = t?.ventasMeses ? [...t.ventasMeses].reverse() : [];
  const pieData = t?.salesByType?.length ? t.salesByType : [];
  const { user } = useContext(AuthContext);
  const isAdmin = user?.permisos?.includes('usuarios') || user?.permisos?.includes('reportes-compras') || user?.permisos?.includes('inventario') || false;

  return (
    <div style={{ padding: isMobile ? '0 4px' : '0 12px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: isMobile ? 12 : 20 }}>
        <Col>
          <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
            {new Date().toLocaleDateString('es-GT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </Text>
        </Col>
      </Row>

      {/* Fila 1 */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={card}>
            {sales.loading ? <Spin /> : <><Statistic title="Ventas Hoy" value={s?.ventasHoy || 0} precision={2} prefix={<DollarOutlined style={{ color:'#1890ff' }} />} suffix="Q" styles={{ content: { color:'#1890ff', fontWeight:700, fontSize: isMobile ? 20 : 26 } }} />
              <div style={{ marginTop:4, fontSize:12, color:'#888', display:'flex', gap:12, flexWrap:'wrap' }}><span>{s?.ventasCountHoy || 0} transacciones</span><span>Prom. {q(s?.ticketPromedio || 0)}</span></div></>}
          </Card>
        </Col>
        {isAdmin && (
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={card}>
            {sales.loading ? <Spin /> : <Statistic title="Compras Hoy" value={s?.comprasHoy || 0} precision={2} prefix={<ShoppingCartOutlined style={{ color:'#52c41a' }} />} suffix="Q" styles={{ content: { color:'#52c41a', fontWeight:600, fontSize: isMobile ? 18 : 22 } }} />}
          </Card>
        </Col>)}
        {!catalog.loading && (<>
          <Col xs={12} sm={6} md={4} lg={4}><Card styles={{ body: { padding: isMobile ? 8 : 12, textAlign:'center' } }} style={card}><AppstoreOutlined style={{ fontSize:22, color:'#1890ff' }} /><div style={{ fontSize:20, fontWeight:700, lineHeight:1.2 }}>{c?.articulos || 0}</div><Text type="secondary" style={{ fontSize:11 }}>Productos</Text></Card></Col>
          <Col xs={12} sm={6} md={4} lg={4}><Card styles={{ body: { padding: isMobile ? 8 : 12, textAlign:'center' } }} style={card}><TeamOutlined style={{ fontSize:22, color:'#52c41a' }} /><div style={{ fontSize:20, fontWeight:700, lineHeight:1.2 }}>{c?.clientes || 0}</div><Text type="secondary" style={{ fontSize:11 }}>Clientes</Text></Card></Col>
          <Col xs={12} sm={6} md={4} lg={4}><Card styles={{ body: { padding: isMobile ? 8 : 12, textAlign:'center' } }} style={card}><ShoppingOutlined style={{ fontSize:22, color:'#fa8c16' }} /><div style={{ fontSize:20, fontWeight:700, lineHeight:1.2 }}>{c?.proveedores || 0}</div><Text type="secondary" style={{ fontSize:11 }}>Proveedores</Text></Card></Col>
        </>)}
        {catalog.loading && <Col xs={12} sm={6} md={4} lg={4}><div style={{ textAlign:'center', padding:20 }}><Spin /></div></Col>}
        {isAdmin && (<>
          <Col xs={24} sm={12} lg={5}>
            <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={card}>
              {dte.loading ? <Spin /> : <><Statistic title="DTE del mes" value={d?.activas || 0} prefix={<FileTextOutlined style={{ color:'#722ed1' }} />} suffix={<Text style={{ fontSize:13, fontWeight:400, color:'#999' }}>/ {d?.anuladas || 0} anul.</Text>} styles={{ content: { color:'#722ed1', fontWeight:600, fontSize: isMobile ? 18 : 22 } }} />
                <div style={{ marginTop:4, fontSize:11, color:'#888', display:'flex', gap:8, flexWrap:'wrap' }}><span>Fact. {q(d?.total || 0)}</span><span>IVA {q(d?.impuesto || 0)}</span></div></>}
            </Card>
          </Col>
          <Col xs={12} sm={6} lg={6}>
            <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={{ ...card, background: 'linear-gradient(135deg, #cf1322, #a8071a)' }}>
              {dte.loading ? <Spin /> : <Statistic title={<span style={{ color:'rgba(255,255,255,0.85)' }}>Impuestos Generados</span>} value={d?.impuesto || 0} precision={2} prefix={<DollarOutlined style={{ color:'#fff' }} />} suffix="Q" valueStyle={{ color:'#fff', fontWeight:700, fontSize: isMobile ? 20 : 26 }} />}
              <Text style={{ color:'rgba(255,255,255,0.65)', fontSize:11, display:'block', marginTop:2 }}>IVA 12% — {d?.activas || 0} facturas en el mes</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6} lg={6}>
            <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={{ ...card, background: 'linear-gradient(135deg, #389e0d, #237804)' }}>
              {trends.loading ? <Spin /> : <Statistic title={<span style={{ color:'rgba(255,255,255,0.85)' }}>Ganancia del Mes</span>} value={gananciaMes} precision={2} prefix={<RiseOutlined style={{ color:'#fff' }} />} suffix="Q" valueStyle={{ color:'#fff', fontWeight:700, fontSize: isMobile ? 20 : 26 }} />}
              <Text style={{ color:'rgba(255,255,255,0.65)', fontSize:11, display:'block', marginTop:2 }}>Q{ventasMes.toFixed(2)} ventas — Q{Number(t?.comprasMes || 0).toFixed(2)} costos</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6} lg={6}>
            <Card styles={{ body: { padding: isMobile ? 10 : 14 } }} style={{ ...card, background: 'linear-gradient(135deg, #1890ff, #096dd9)' }}>
              {sales.loading ? <Spin /> : <Statistic title={<span style={{ color:'rgba(255,255,255,0.85)' }}>Ganancia del Día</span>} value={(s?.ventasHoy || 0) - (s?.comprasHoy || 0)} precision={2} prefix={<RiseOutlined style={{ color:'#fff' }} />} suffix="Q" valueStyle={{ color:'#fff', fontWeight:700, fontSize: isMobile ? 20 : 26 }} />}
              <Text style={{ color:'rgba(255,255,255,0.65)', fontSize:11, display:'block', marginTop:2 }}>Q{Number(s?.ventasHoy || 0).toFixed(2)} ventas — Q{Number(s?.comprasHoy || 0).toFixed(2)} compras hoy</Text>
            </Card>
          </Col>
        </>)}
      </Row>

      {/* Fila 2 */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginTop: isMobile ? 8 : 16 }}>
        <Col xs={24} lg={6}>
          <Card title={<><WarningOutlined style={{ color:'#faad14' }} /> Stock Bajo</>} size="small" styles={{ body: { padding:0 } }} style={card}>
            {catalog.loading ? <div style={{ padding:16, textAlign:'center' }}><Spin /></div> : !c?.stockBajo?.length ? <div style={{ padding:16, textAlign:'center' }}><Text type="secondary">✅ Stock suficiente</Text></div>
            : <div style={{ maxHeight:130, overflow:'auto' }}>{c.stockBajo.map((p:StockItem) => <Row key={p.idarticulo} align="middle" style={{ padding:'5px 12px', borderBottom:'1px solid #f5f5f5' }}><Col flex="auto"><Text style={{ fontSize:12 }}>{p.nombre}</Text></Col><Col><Tag color={p.stock === 0 ? 'red' : 'orange'}>{p.stock} und.</Tag></Col></Row>)}</div>}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title={<><PieChartOutlined style={{ color:'#722ed1' }} /> Ventas por Tipo</>} size="small" style={card}>
            {trends.loading ? <div style={{ textAlign:'center', padding:20 }}><Spin /></div> : !pieData.length ? <div style={{ textAlign:'center', padding:20 }}><Text type="secondary">Sin datos</Text></div>
            : <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}><PieChart><Pie data={pieData} dataKey="cantidad" nameKey="tipo_comprobante" cx="50%" cy="45%" innerRadius={40} outerRadius={70} paddingAngle={3}>{pieData.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} /></PieChart></ResponsiveContainer>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><RiseOutlined style={{ color:'#1890ff' }} /> Ventas Mensuales</>} size="small" style={card}>
            {trends.loading ? <div style={{ textAlign:'center', padding:20 }}><Spin /></div> : !meses.length ? <div style={{ textAlign:'center', padding:16 }}><Text type="secondary">Sin datos</Text></div>
            : <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}><BarChart data={meses} margin={{ top:8, right:8, left:0, bottom:0 }}><XAxis dataKey="mes" tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(v:string)=> { const [,m]=v.split('-'); return MONTH_NAMES[parseInt(m)-1]||v; }} /><YAxis tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(v:number)=> `Q${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(value:any)=>[`Q${Number(value).toFixed(2)}`,'Total']} /><Bar dataKey="total" radius={[4,4,0,0]} maxBarSize={40}>{meses.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>}
          </Card>
        </Col>
      </Row>

      {/* Fila 3 */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginTop: isMobile ? 8 : 16 }}>
        <Col xs={24} md={12}>
          <Card title={<><RiseOutlined style={{ color:'#52c41a' }} /> Más vendidos hoy</>} size="small" styles={{ body: { padding:0 } }} style={card}>
            {trends.loading ? <div style={{ textAlign:'center', padding:20 }}><Spin /></div> : !t?.productosTop?.length ? <div style={{ padding:16, textAlign:'center' }}><Text type="secondary">Sin ventas hoy</Text></div>
            : t.productosTop.map((p:any,i:number) => <Row key={p.codigo||i} align="middle" style={{ padding:'6px 12px', borderBottom:'1px solid #f5f5f5' }}><Col flex="auto"><Text style={{ fontSize: isMobile ? 12 : 13 }}>{p.nombre}</Text><Text type="secondary" style={{ fontSize:11, marginLeft:4 }}>×{p.vendidos}</Text></Col><Col><Text style={{ fontSize: isMobile ? 12 : 13, fontWeight:600 }}>{q(p.total_vendido)}</Text><Tag color="green" style={{ fontSize:9, marginLeft:4, lineHeight:'14px' }}>Top {i+1}</Tag></Col></Row>)}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><ShoppingCartOutlined style={{ color:'#722ed1' }} /> Últimas ventas</>} size="small" styles={{ body: { padding:0 } }} style={card}>
            {trends.loading ? <div style={{ textAlign:'center', padding:20 }}><Spin /></div> : !t?.ventasRecientes?.length ? <div style={{ padding:16, textAlign:'center' }}><Text type="secondary">Sin ventas</Text></div>
            : t.ventasRecientes.map((v:any) => <Row key={v.idventa} align="middle" style={{ padding:'6px 12px', borderBottom:'1px solid #f5f5f5' }}><Col flex="auto"><Text style={{ fontSize: isMobile ? 12 : 13 }}>{v.cliente||'Consumidor Final'}</Text><div><Tag color={tc[v.tipo_comprobante]||'default'} style={{ fontSize:9, lineHeight:'14px' }}>{v.tipo_comprobante}</Tag><Text type="secondary" style={{ fontSize:10 }}> {v.serie_comprobante||''}{v.num_comprobante||''}</Text></div></Col><Col><Text style={{ fontSize: isMobile ? 12 : 13, fontWeight:600 }}>{q(v.total_venta)}</Text></Col></Row>)}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };