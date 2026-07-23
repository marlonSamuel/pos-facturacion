import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Typography, Row, Col } from 'antd';
import type { IPerson } from '../../interfaces/IPerson';

const { Text } = Typography;

interface Props {
  open: boolean;
  editing: IPerson | null;
  tipo: 'Cliente' | 'Proveedor';
  onOk: (values: Partial<IPerson>) => Promise<void>;
  onCancel: () => void;
}

export const PersonForm = ({ open, editing, tipo, onOk, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const tipoDoc = Form.useWatch('tipo_documento', form);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue(editing);
      } else {
        form.resetFields();
      }
    }
  }, [open, editing]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Si es CF, asignar "CF" como número de documento
      if (values.tipo_documento === 'CF') {
        values.num_documento = 'CF';
      }
      setLoading(true);
      await onOk(values);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editing ? `Editar ${tipo}` : `Nuevo ${tipo}`}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText={editing ? 'Actualizar' : 'Crear'}
      confirmLoading={loading}
      destroyOnHidden
      okButtonProps={{ size: 'small' }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="tipo_documento" label="Tipo Documento" initialValue="NIT" rules={[{ required: true, message: 'Seleccione un tipo' }]}>
          <Select options={[
            { value: 'NIT', label: 'NIT' },
            { value: 'CF', label: 'CF (Consumidor Final)' },
            { value: 'DPI', label: 'DPI' }
          ]} />
        </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            {tipoDoc !== 'CF' && (
              <Form.Item name="num_documento" label="No. Documento" rules={[{ required: true, message: 'Requerido para este tipo' }]}>
            <Input />
          </Form.Item>
        )}
          </Col>
        </Row>
        {tipoDoc === 'CF' && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            Consumidor Final — se guardará como "CF"
          </Text>
        )}
        <Form.Item name="telefono" label="Teléfono">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input type="email" />
        </Form.Item>
        <Form.Item name="direccion" label="Dirección">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
