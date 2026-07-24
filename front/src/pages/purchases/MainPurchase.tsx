import { useContext, useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Select, Table, InputNumber, Button, Space, Typography, Divider, Form, Input, DatePicker, Popconfirm, message, Grid, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';
import { InlineProviderSelect } from '../../components/purchases/InlineProviderSelect';
import { InlineArticleSelect } from '../../components/purchases/InlineArticleSelect';
import { articleService } from '../../services/articleService';
import { ShopContext } from '../../context/shop/ShopContext';
import { usePurchase } from '../../hooks/usePurchase';
import type { ICartItem } from '../../interfaces/IPurchase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export const MainPurchase = () => {
  const { create } = usePurchase();
  const { items: cartItems, addItem, removeItem, updateQty, clear, total } = useContext(ShopContext);
  const [form] = Form.useForm();
  const [selectedArticle, setSelectedArticle] = useState<number | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [priceBuy, setPriceBuy] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [articleNames, setArticleNames] = useState<Record<number, string>>({});
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const artRef = useRef<any>(null);

  useEffect(() => {
    articleService.getAll().then(list => {
      const map: Record<number, string> = {};
      list.forEach(a => { map[a.idarticulo] = a.nombre; });
      setArticleNames(map);
    }).catch(() => {});
  }, []);

  const handleAddArticle = () => {
    if (!selectedArticle) { message.warning('Seleccione un artículo'); return; }
    if (qty < 1) { message.warning('Cantidad inválida'); return; }
    if (priceBuy <= 0) { message.warning('Precio compra inválido'); return; }

    addItem({
      idarticulo: selectedArticle,
      nombre: articleNames[selectedArticle] || '',
      codigo: '',
      cantidad: qty,
      precio_compra: priceBuy,
      subtotal: qty * priceBuy
    });

    setSelectedArticle(undefined);
    setQty(1);
    setPriceBuy(0);
    if (artRef.current) artRef.current.focus();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (cartItems.length === 0) { message.warning('Agregue al menos un artículo'); return; }
      if (cartItems.some(i => i.cantidad <= 0)) { message.warning('Cantidad inválida en uno de los artículos'); return; }
      if (cartItems.some(i => i.precio_compra <= 0)) { message.warning('Precio de compra inválido en uno de los artículos'); return; }
      if (total <= 0) { message.warning('El total de la compra debe ser mayor a cero'); return; }

      setSaving(true);
      const payload = {
        idproveedor: values.idproveedor,
        tipo_comprobante: values.tipo_comprobante,
        serie_comprobante: values.serie_comprobante || '',
        num_comprobante: values.num_comprobante,
        fecha_hora: values.fecha_hora.toISOString(),
        total_compra: total,
        impuesto: 0,
        detalles: cartItems.map(item => ({
          idarticulo: item.idarticulo,
          cantidad: item.cantidad,
          precio_compra: item.precio_compra,
        }))
      };

      const ok = await create(payload);
      if (ok) {
        clear();
        form.resetFields();
        setRefreshKey(k => k + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const cartColumns = [
    { title: 'Artículo', dataIndex: 'nombre', key: 'nombre', ellipsis: true },
    { title: 'Cant.', dataIndex: 'cantidad', key: 'cantidad', width: 80,
      render: (v: number, r: ICartItem) => (
        <InputNumber min={1} value={v} onChange={val => updateQty(r.idarticulo, val || 1)}
          style={{ width: 60 }} size="small" />
      )
    },
    { title: 'P. Compra', dataIndex: 'precio_compra', key: 'precio_compra', width: 100,
      render: (v: number) => `Q${v.toFixed(2)}` },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', width: 100,
      render: (v: number) => `Q${v.toFixed(2)}` },
    {
      title: '', key: 'accion', width: 40,
      render: (_: any, r: ICartItem) => (
        <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(r.idarticulo)} />
      )
    }
  ];

  const formContent = (
    <Form form={form} layout="vertical" size="small">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="idproveedor" label="Proveedor" rules={[{ required: true, message: 'Requerido' }]}>
            <InlineProviderSelect />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="tipo_comprobante" label="Tipo" rules={[{ required: true, message: 'Requerido' }]} initialValue="Factura">
            <Select options={[
              { value: 'Factura', label: 'Factura' },
              { value: 'Ticket', label: 'Ticket' },
              { value: 'Nota de Débito', label: 'Nota Débito' }
            ]} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="serie_comprobante" label="Serie">
            <Input placeholder="A" size="small" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="num_comprobante" label="No. Comprobante" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="001-001-0000001" size="small" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="fecha_hora" label="Fecha" rules={[{ required: true, message: 'Requerida' }]}
            initialValue={dayjs()}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const addArticleSection = (
    <Row gutter={[8, 8]} align="middle">
      <Col xs={24} sm={8} md={6}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Artículo</Text>
          <InlineArticleSelect
            key={refreshKey}
            value={selectedArticle}
            excludeIds={cartItems.map(i => i.idarticulo)}
            onChange={async v => {
              setSelectedArticle(v);
              if (v) {
                try {
                  const prices = await articleService.getLastPurchasePrice(v);
                  setPriceBuy(prices.precio_compra || 0);
                } catch {
                  setPriceBuy(0);
                }
              } else {
                setPriceBuy(0);
              }
            }}
          />
        </div>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Cantidad</Text>
          <InputNumber placeholder="0" min={1} value={qty} onChange={v => setQty(v || 1)} style={{ width: '100%' }} />
        </div>
      </Col>
      <Col xs={8} sm={4} md={3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>P. Compra (Q)</Text>
          <InputNumber placeholder="0.00" min={0.01} step={0.01}
            value={priceBuy} onChange={v => setPriceBuy(v || 0)} style={{ width: '100%' }} />
        </div>
      </Col>

      <Col xs={24} sm={4} md={3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text type="secondary" style={{ fontSize: 11, visibility: 'hidden' }}> </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArticle} block>
            Agregar
          </Button>
        </div>
      </Col>
    </Row>
  );

  return (
    <Spin spinning={saving} tip="Guardando compra..." size="large">
    <div>
      <Title level={3} style={{ marginBottom: 8 }}><ShoppingCartOutlined /> Nueva Compra</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Registre una compra a proveedor con detalle de artículos
      </Text>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Datos de la compra">
            {formContent}
          </Card>

          <Card title="Agregar Artículos" style={{ marginTop: 16 }}>
            {addArticleSection}
          </Card>

          <Card title={<span><ShoppingCartOutlined /> Carrito ({cartItems.length})</span>}
            style={{ marginTop: 16 }}>
            {cartItems.length === 0 ? (
              <Text type="secondary">Carrito vacío. Agregue artículos desde arriba.</Text>
            ) : (
              <Table
                dataSource={cartItems}
                columns={cartColumns}
                rowKey="idarticulo"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text strong style={{ fontSize: 16 }}>Total:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ fontSize: 16 }}>Q{total.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Button type="link" danger icon={<ClearOutlined />} onClick={clear}
                        size="small">Limpiar</Button>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Resumen"
            style={{ position: isMobile ? 'static' : 'sticky', top: 80 }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Title level={2} style={{ margin: 0, color: 'var(--blue-primary)' }}>
                Q{total.toFixed(2)}
              </Title>
              <Text type="secondary">{cartItems.length} artículo(s)</Text>
            </div>

            <Divider />

            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Button type="primary" icon={<SaveOutlined />} size="large" block
                loading={saving} onClick={handleSubmit}
                disabled={cartItems.length === 0}>
                Guardar Compra
              </Button>
              <Popconfirm title="Limpiar carrito" description="¿Descartar todos los artículos?"
                onConfirm={clear} okText="Sí" cancelText="No">
                <Button icon={<ClearOutlined />} block disabled={cartItems.length === 0}>
                  Limpiar Carrito
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        </Col>
      </Row>
    </div></Spin>
  );
};
