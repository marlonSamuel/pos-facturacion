import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, Button, Typography, Row, Col, Tag } from 'antd';
import { UploadOutlined, BankOutlined } from '@ant-design/icons';
import Barcode from 'react-barcode';
import type { UploadFile } from 'antd';
import type { IArticle } from '../../../interfaces/IArticle';
import type { ICategory } from '../../../interfaces/ICategory';
import type { ISucursalInfo } from '../../../services/sucursalService';

const { Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Props {
  open: boolean;
  editing: IArticle | null;
  categories: ICategory[];
  sucursales: ISucursalInfo[];
  onOk: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  hideStock?: boolean;
}

export const ArticleForm = ({ open, editing, categories, sucursales, onOk, onCancel, hideStock: _hideStock }: Props) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockPorSucursal, setStockPorSucursal] = useState<Record<number, number>>({});
  const codigo = Form.useWatch('codigo', form);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue(editing);
        setFileList(editing.imagen ? [{
          uid: '-1',
          name: editing.imagen,
          status: 'done',
          url: `${API_URL.replace('/api', '')}/uploads/products/${editing.imagen}`
        }] : []);
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [open, editing]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k !== 'stock') formData.append(k, String(v ?? ''));
      });
      // Agregar stock por sucursal
      const stocks = Object.entries(stockPorSucursal).filter(([, s]) => s > 0);
      if (stocks.length > 0) {
        formData.append('stockPorSucursal', JSON.stringify(Object.fromEntries(stocks)));
      } else if (values.stock) {
        formData.append('stock', String(values.stock));
      }
      if (fileList[0]?.originFileObj) {
        formData.append('imagen', fileList[0].originFileObj);
      }
      setLoading(true);
      await onOk(formData);
      form.resetFields();
      setFileList([]);
      setStockPorSucursal({});
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  return (
    <Modal
      title={editing ? 'Editar Artículo' : 'Nuevo Artículo'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={editing ? 'Actualizar' : 'Crear'}
      confirmLoading={loading}
      width={520}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      destroyOnHidden
      okButtonProps={{ size: 'small' }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="idcategoria" label="Categoría" rules={[{ required: true, message: 'Requerido' }]}>
              <Select options={categories.filter(c => c.condicion).map(c => ({ value: c.idcategoria, label: c.nombre }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="codigo" label="Código (SKU / código de barras)">
              <Input placeholder="Ej: 7501234567890" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="precio_venta" label="Precio Venta (Q)" rules={[{ required: true, message: 'Requerido' }]}>
              <InputNumber min={0.01} step={0.01} prefix="Q" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          {!editing ? (
            <Col xs={24} md={12}>
              <Form.Item label="Stock Inicial por Sucursal">
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sucursales.map(s => (
                    <div key={s.idsucursal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag icon={<BankOutlined />} style={{ minWidth: 140, textAlign: 'left', margin: 0 }}>{s.nombre}</Tag>
                      <InputNumber
                        min={0} step={1} precision={0}
                        style={{ width: '100%' }}
                        placeholder="Stock"
                        value={stockPorSucursal[s.idsucursal] ?? ''}
                        onChange={v => setStockPorSucursal(prev => ({ ...prev, [s.idsucursal]: v ?? 0 }))}
                      />
                    </div>
                  ))}
                </div>
              </Form.Item>
            </Col>
          ) : (
            <Col xs={24} md={12}>
              <Form.Item name="stock" label="Stock (solo admin)">
                <InputNumber min={0} step={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          )}
        </Row>

        {codigo && (
          <div style={{ textAlign: 'center', marginBottom: 16, padding: 8, background: '#fff', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Vista previa:</Text>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 220, overflow: 'hidden' }}>
                <Barcode value={codigo} width={1.2} height={35} displayValue={false} margin={0} />
              </div>
            </div>
          </div>
        )}

        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item label="Imagen">
          <Upload
            listType="picture"
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
