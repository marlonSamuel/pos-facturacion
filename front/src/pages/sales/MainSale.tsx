import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Card, Row, Col, Table, InputNumber, Button, Space, Typography, Divider, Input, Tag, Modal, Grid, Descriptions, Radio, Badge, Drawer, Spin } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ClearOutlined, SaveOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { InlineClientSelect } from '../../components/sales/InlineClientSelect';
import { articleService } from '../../services/articleService';
import { SaleContext } from '../../context/sale/SaleContext';
import { AuthContext } from '../../context/auth/AuthContext';
import { useSale } from '../../hooks/useSale';
import { printHtml, printPdf } from '../../helpers/printUtils';
import type { ICartItemSale } from '../../interfaces/ISale';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const MainSale = () => {
  const { create } = useSale();
  const { items: cartItems, addItem, removeItem, updateQty, updateDiscount, clear, tipoVenta, setTipoVenta, subtotal, totalImpuesto, total, baseImponible, count } = useContext(SaleContext);
  const [articles, setArticles] = useState<any[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | undefined>(undefined);
  const [selectedClientName, setSelectedClientName] = useState<string>('Consumidor Final');
  const [comprobante, setComprobante] = useState<'Boleta' | 'Ticket' | 'Factura'>('Boleta');
  const [saving, setSaving] = useState(false);
  const { comercioInfo } = useContext(AuthContext);
  const [resultModal, setResultModal] = useState<{ open: boolean; idventa?: number; serie?: string; num?: string; autorizacion?: string; tipo: string; savedTotal?: number; savedImpuesto?: number; savedItems?: ICartItemSale[]; savedClientName?: string }>({ open: false, tipo: 'Ticket' });
  const [cartOpen, setCartOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const searchRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const LIMIT = 20;

  const fetchArticles = useCallback(async (q: string, cat: number | 'all', offset = 0) => {
    setLoadingArticles(true);
    try {
      const categoryId = cat === 'all' ? undefined : (cat as number);
      const result = await articleService.search(q, LIMIT, offset, categoryId);
      // El backend ya retorna stock via LEFT JOIN con articulo_sucursal
      if (offset === 0) {
        setArticles(result.rows);
      } else {
        setArticles(prev => [...prev, ...result.rows]);
      }
      setTotalArticles(result.total);
    } catch { /* ignore */ }
    setLoadingArticles(false);
  }, []);

  useEffect(() => {
    loadCategories();
    fetchArticles('', 'all', 0);
    clear();
    setTimeout(() => searchRef.current?.focus(), 500);
  }, [fetchArticles]);

  const loadCategories = async () => {
    try {
      const { categoryService } = await import('../../services/categoryService');
      const list = await categoryService.getAll();
      setCategories(list);
    } catch { /* ignore */ }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchArticles(search, categoryFilter, 0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, categoryFilter, fetchArticles]);

  const handleAddArticle = (article: any) => {
    if (article.stock <= 0) return;

    const precio = parseFloat(article.precio_venta);
    if (!precio || precio <= 0) {
      message.warning(`"${article.nombre}" no tiene precio de venta configurado`);
      return;
    }

    // Verificar si ya está en el carrito
    if (cartItems.some(i => i.idarticulo === article.idarticulo)) {
      message.info('Producto ya agregado — ajuste la cantidad en el detalle');
      return;
    }

    addItem({
      idarticulo: article.idarticulo,
      nombre: article.nombre,
      codigo: article.codigo || '',
      cantidad: 1,
      precio_venta: precio,
      descuento: 0,
      subtotal: precio,
      stock: article.stock
    });

    setSearch('');
    searchRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!selectedClient) { message.warning('Seleccione un cliente'); return; }
    if (cartItems.length === 0) { message.warning('Agregue al menos un artículo'); return; }
    if (cartItems.some(i => i.cantidad <= 0)) { message.warning('Cantidad inválida en uno de los artículos'); return; }
    if (cartItems.some(i => i.precio_venta <= 0)) { message.warning('Precio de venta inválido en uno de los artículos'); return; }
    if (total <= 0) { message.warning('El total de la venta debe ser mayor a cero'); return; }

    setSaving(true);
    try {
      const payload = {
        idcliente: selectedClient,
        tipo_comprobante: comprobante,
        tipo_venta: tipoVenta,
        fecha_hora: new Date().toISOString(),
        total_venta: total,
        impuesto: totalImpuesto,
        detalles: cartItems.map(item => ({
          idarticulo: item.idarticulo,
          cantidad: item.cantidad,
          precio_venta: item.precio_venta,
          descuento: item.descuento
        }))
      };

      const result = await create(payload);
      if (result) {
        // Guardar datos ANTES de limpiar el carrito
        const savedTotal = total;
        const savedImpuesto = totalImpuesto;
        const savedItems = cartItems.map(item => ({ ...item }));
        const savedTipo = comprobante;
        const savedClientName = selectedClientName;

        clear();
        setSelectedClient(undefined);
        setSelectedClientName('Consumidor final');
        setComprobante('Boleta');
        setTipoVenta('CA');
        setCartOpen(false);

        setResultModal({
          open: true,
          idventa: (result as any).idventa,
          serie: (result as any).serie,
          num: (result as any).num,
          autorizacion: (result as any).autorizacion,
          tipo: savedTipo,
          savedTotal,
          savedImpuesto,
          savedItems,
          savedClientName
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const closeResultModal = () => {
    setResultModal({ open: false, tipo: 'Ticket', savedTotal: undefined, savedImpuesto: undefined, savedItems: undefined, savedClientName: undefined });
    fetchArticles('', 'all', 0);
  };

  const cartColumns = [
    { title: 'Artículo', dataIndex: 'nombre', key: 'nombre', ellipsis: true },
    {
      title: 'Cant.', dataIndex: 'cantidad', key: 'cantidad', width: isMobile ? 56 : 70,
      render: (v: number, r: ICartItemSale) => (
        <InputNumber min={1} max={r.stock} value={v}
          onChange={val => updateQty(r.idarticulo, val || 1)}
          style={{ width: 52 }} size="small" />
      )
    },
    {
      title: 'Precio', dataIndex: 'precio_venta', key: 'precio_venta', width: isMobile ? 65 : 90,
      render: (v: number) => `Q${v.toFixed(2)}`
    },
    ...(!isMobile ? [{
      title: 'Desc.', dataIndex: 'descuento', key: 'descuento', width: 80,
      render: (v: number, r: ICartItemSale) => (
        <InputNumber min={0} max={r.subtotal + v} value={v}
          onChange={val => updateDiscount(r.idarticulo, val || 0)}
          style={{ width: 70 }} size="small" step={0.5} />
      )
    }] : []),
    {
      title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', width: isMobile ? 65 : 90,
      render: (v: number) => `Q${v.toFixed(2)}`
    },
    {
      title: '', key: 'action', width: 36,
      render: (_: any, r: ICartItemSale) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(r.idarticulo)} size="small" />
      )
    }
  ];

  // Contenido del carrito (compartido entre Drawer móvil y columna desktop)
  const cartContent = (inDrawer: boolean) => (
    <>
      <div style={{ marginBottom: 8 }}>
        <InlineClientSelect value={selectedClient} onChange={(val, opt) => {
          setSelectedClient(val);
          if (opt?.label) setSelectedClientName(opt.label);
        }} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', marginBottom: 8, minHeight: 100 }}>
        <Table
          dataSource={cartItems}
          columns={cartColumns}
          rowKey="idarticulo"
          pagination={false}
          size="small"
          scroll={{ y: inDrawer ? 240 : isMobile ? 180 : 300 }}
          locale={{ emptyText: 'Agregue productos tocando en el panel izquierdo' }}
        />
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <Descriptions size="small" column={1}>
          {comprobante === 'Factura' ? (
            <Descriptions.Item label="Subtotal (sin IVA)"><Text>Q{baseImponible.toFixed(2)}</Text></Descriptions.Item>
          ) : (
            <Descriptions.Item label="Subtotal"><Text>Q{subtotal.toFixed(2)}</Text></Descriptions.Item>
          )}
          {comprobante === 'Factura' && <Descriptions.Item label="IVA (12%)"><Text>Q{totalImpuesto.toFixed(2)}</Text></Descriptions.Item>}
          <Descriptions.Item label="Total">
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>Q{total.toFixed(2)}</Title>
          </Descriptions.Item>
        </Descriptions>
        <Divider style={{ margin: '8px 0' }} />
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={saving}
          disabled={cartItems.length === 0 || !selectedClient}
          size="small"
          block
          style={{ height: 40, fontSize: 16 }}
        >
          Finalizar Venta
        </Button>
      </div>
    </>
  );

  return (
    <Spin spinning={saving} tip="Guardando venta..." size="large">
      <div style={{ height: isMobile ? '100%' : 'calc(100vh - 140px)', overflow: 'hidden', position: 'relative' }}>
      <Row gutter={12} style={{ height: '100%' }}>
        {/* Panel productos */}
        <Col xs={24} md={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 64 : 0 }}>
          <Card size="small" style={{ marginBottom: 8, flexShrink: 0 }}>
            <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
              <Col xs={24} md={14}>
                <Input
                  ref={searchRef}
                  prefix={<SearchOutlined />}
                  placeholder="Buscar por nombre o SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  allowClear
                  size="small"
                />
              </Col>
              <Col xs={24} md={10}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: isMobile ? 4 : 0 }}>
                  <Radio.Group
                    value={comprobante}
                    onChange={e => setComprobante(e.target.value)}
                    size="small"
                    optionType="button"
                    buttonStyle="solid"
                    style={{ display: 'flex', flex: 1, minWidth: 0 }}
                  >
                    <Radio.Button value="Boleta" style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: isMobile ? '0 4px' : '0 12px' }}>{isMobile ? '🧾 B' : '🧾 Boleta'}</Radio.Button>
                    <Radio.Button value="Ticket" style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: isMobile ? '0 4px' : '0 12px' }}>{isMobile ? '🎫 T' : '🎫 Ticket'}</Radio.Button>
                    <Radio.Button value="Factura" style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: isMobile ? '0 4px' : '0 12px' }}>{isMobile ? '📄 F' : '📄 Factura'}</Radio.Button>
                  </Radio.Group>
                  <Radio.Group
                    value={tipoVenta}
                    onChange={e => setTipoVenta(e.target.value)}
                    size="small"
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="CA" style={{ fontSize: 11, padding: isMobile ? '0 4px' : '0 8px' }}>{isMobile ? '💰 C' : '💰 Contado'}</Radio.Button>
                    <Radio.Button value="CR" style={{ fontSize: 11, padding: isMobile ? '0 4px' : '0 8px' }}>{isMobile ? '📋 Cr' : '📋 Crédito'}</Radio.Button>
                  </Radio.Group>
                </div>
              </Col>
            </Row>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 4,
              maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)'
            }}>
              <Tag color={categoryFilter === 'all' ? 'blue' : 'default'}
                style={{ cursor: 'pointer', flexShrink: 0, margin: 0, padding: '2px 14px', fontSize: 13, lineHeight: '22px' }}
                onClick={() => setCategoryFilter('all')}>Todas</Tag>
              {categories.filter((c: any) => c.condicion).map((c: any) => (
                <Tag key={c.idcategoria}
                  color={categoryFilter === c.idcategoria ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', flexShrink: 0, margin: 0, padding: '2px 14px', fontSize: 13, lineHeight: '22px' }}
                  onClick={() => setCategoryFilter(c.idcategoria)}>{c.nombre}</Tag>
              ))}
            </div>
          </Card>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
            <Row gutter={[8, 8]}>
              {articles.map((a: any) => (
                <Col xs={12} sm={8} md={6} key={a.idarticulo}>
                  <Card hoverable size="small" onClick={() => handleAddArticle(a)}
                    style={{ opacity: a.stock > 0 ? 1 : 0.4, cursor: a.stock > 0 ? 'pointer' : 'not-allowed', height: '100%' }}
                    styles={{ body: { padding: 6 } }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {a.imagen && a.imagen !== 'default.png' ? (
                        <img src={`${API_URL.replace('/api', '')}/uploads/products/${a.imagen}`} alt={a.nombre}
                          style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }} ellipsis>{a.nombre}</Text>
                        {a.codigo && <Text type="secondary" style={{ fontSize: 9, display: 'block' }}>{a.codigo}</Text>}
                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>Q{parseFloat(a.precio_venta || 0).toFixed(2)}</Text>
                        {a.stock <= 5 && (
                          <Tag color={a.stock > 0 ? 'orange' : 'red'} style={{ fontSize: 9, marginLeft: 2, lineHeight: '14px' }}>
                            {a.stock > 0 ? `S:${a.stock}` : 'Agot'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
              {articles.length === 0 && !loadingArticles && (
                <Col span={24} style={{ textAlign: 'center', padding: 40 }}>
                  <Text type="secondary">{search ? 'No se encontraron productos' : 'Cargando productos...'}</Text>
                </Col>
              )}
              {loadingArticles && (
                <Col span={24} style={{ textAlign: 'center', padding: 20 }}>
                  <Spin size="small" />
                </Col>
              )}
              {!loadingArticles && articles.length > 0 && articles.length < totalArticles && (
                <Col span={24} style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Button type="link" onClick={() => fetchArticles(search, categoryFilter, articles.length)}>
                    Cargar más ({totalArticles - articles.length} restantes)
                  </Button>
                </Col>
              )}
            </Row>
          </div>
        </Col>

        {/* Carrito escritorio: columna lateral */}
        {!isMobile && (
          <Col md={8} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card size="small"
              title={<Space><ShoppingCartOutlined /> Venta ({count})</Space>}
              extra={<Button type="text" danger icon={<ClearOutlined />} onClick={clear} size="small" disabled={cartItems.length === 0}>Limpiar</Button>}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 8, overflow: 'hidden' } }}>
              {cartContent(false)}
            </Card>
          </Col>
        )}
      </Row>

      {/* Barra inferior flotante — móvil */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: '#fff', borderTop: '1px solid #f0f0f0',
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
        }}>
          <Badge count={count} overflowCount={99} size="small">
            <Button type="default" icon={<ShoppingCartOutlined />} onClick={() => setCartOpen(true)} size="middle" />
          </Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 16, color: '#52c41a' }}>Q{total.toFixed(2)}</Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{comprobante}</Text>
          </div>
          <Button type="primary" onClick={() => setCartOpen(true)} size="small">Ver Carrito</Button>
        </div>
      )}

      {/* Drawer carrito — móvil */}
      <Drawer
        title={<Space><ShoppingCartOutlined /> Venta ({count})</Space>}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        placement="bottom"
        size="large"
        extra={
          <Button type="text" danger icon={<ClearOutlined />}
            onClick={() => { clear(); setCartOpen(false); }}
            size="small" disabled={cartItems.length === 0}>Limpiar</Button>
        }
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {cartContent(true)}
        </div>
      </Drawer>

      {/* Modal resultado */}
      <Modal
        title={<span style={{ fontSize: 14 }}>✅ Venta — Q{(resultModal.savedTotal ?? total).toFixed(2)}</span>}
        open={resultModal.open}
        onOk={() => setResultModal({ open: false, tipo: 'Ticket' })}
        okText="Cerrar"
        footer={
          <Space>
            {resultModal.tipo === 'Ticket' ? (
              <Button icon={<PrinterOutlined />} onClick={() => {
                const items = resultModal.savedItems ?? cartItems;
                const totalPrint = resultModal.savedTotal ?? total;
                const cliente = resultModal.savedClientName || 'Consumidor Final';
                const content = `
                  <html><head><meta charset="utf-8"><title>${comprobante === 'Factura' ? 'Factura' : 'Ticket'}</title>
                  <style>
                    body{font-family:monospace;font-size:13px;max-width:300px;margin:auto;padding:10px}
                    h2{text-align:center;margin:4px 0}
                    .info{text-align:center;font-size:12px;margin:2px 0}
                    table{width:100%;border-collapse:collapse}
                    th,td{padding:3px 4px;text-align:left}
                    th{border-bottom:1px solid #000}
                    .total{font-weight:bold;border-top:2px solid #000;padding-top:4px}
                    .footer{text-align:center;margin-top:12px;font-size:12px}
                    hr{border:none;border-top:1px dashed #000}
                  </style></head><body>
                  <h2>${comercioInfo?.nombre || 'NEW HORIZON'}</h2>
                  ${comercioInfo?.logo ? `<img src="${API_URL.replace('/api', '')}/uploads/comercios/${comercioInfo.logo}" style="display:block;margin:4px auto;max-width:80px;max-height:40px;object-fit:contain" />` : ''}
                  <p class="info">${comercioInfo?.direccion || 'Chiquimulilla, Santa Rosa'}<br>${comercioInfo?.telefono ? 'Tel: ' + comercioInfo.telefono : ''}</p>
                  <hr>
                  <p><b>No.</b> ${resultModal.serie || ''}-${resultModal.num || ''}</p>
                  <p><b>Tipo:</b> ${resultModal.tipo}</p>
                  <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>
                  <p><b>Cliente:</b> ${cliente}</p>
                  <hr>
                  <table><tr><th align="left">Cant.</th><th align="left">Desc.</th><th align="right">Total</th></tr>
                  ${items.map((i: any) => `<tr><td>${i.cantidad}</td><td>${i.nombre}</td><td align="right">Q${(i.cantidad * i.precio_venta - i.descuento).toFixed(2)}</td></tr>`).join('')}
                  </table>
                  <hr>
                  <p class="total">TOTAL: Q${totalPrint.toFixed(2)}</p>
                  <p>Artículos: ${items.reduce((s: number, i: any) => s + i.cantidad, 0)}</p>
                  <hr>
                  <p class="footer">¡Gracias por su compra!<br>${comercioInfo?.nombre || 'New Horizon'}</p>
                  </body></html>`;
                printHtml(content);
              }}>Imprimir Ticket</Button>
            ) : (
              <Button icon={<PrinterOutlined />} onClick={async () => {
                const api = (await import('../../api/axios')).default;
                const resp = await api.get(`/sales/${resultModal.idventa}/pdf`, { responseType: 'blob' });
                printPdf(URL.createObjectURL(resp.data));
              }}>Imprimir</Button>
            )}
            <Button type="primary" onClick={closeResultModal}>Nueva Venta</Button>
          </Space>
        }
        width={600}
        onCancel={closeResultModal}
        destroyOnHidden
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Tipo">{resultModal.tipo}</Descriptions.Item>
          {resultModal.serie && resultModal.num && (
            <Descriptions.Item label="No. Documento">{resultModal.serie}-{resultModal.num}</Descriptions.Item>
          )}
          {resultModal.autorizacion && <Descriptions.Item label="Autorización">{resultModal.autorizacion}</Descriptions.Item>}
          {resultModal.tipo === 'Factura' && (
            <Descriptions.Item label="Subtotal (sin IVA)">Q{((resultModal.savedTotal ?? total) - (resultModal.savedImpuesto ?? totalImpuesto)).toFixed(2)}</Descriptions.Item>
          )}
          {resultModal.tipo === 'Factura' && (
            <Descriptions.Item label="IVA (12%)">Q{(resultModal.savedImpuesto ?? totalImpuesto).toFixed(2)}</Descriptions.Item>
          )}
          <Descriptions.Item label="Total">Q{(resultModal.savedTotal ?? total).toFixed(2)}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div></Spin>
  );
};


