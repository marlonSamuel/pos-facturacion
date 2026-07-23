import { useEffect, useState } from 'react';
import { Modal, Form, Input, Checkbox, Typography, Row, Col, Card } from 'antd';
import type { IRol } from '../../interfaces/IRol';
import type { IPermission } from '../../interfaces/IUser';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  open: boolean;
  editing: IRol | null;
  permissions: IPermission[];
  onOk: (data: { nombre: string; descripcion?: string; permisos: number[] }) => Promise<void>;
  onCancel: () => void;
}

export const RoleForm = ({ open, editing, permissions, onOk, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          nombre: editing.nombre,
          descripcion: editing.descripcion,
          permisos: editing.permisos
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editing]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onOk({
        nombre: values.nombre,
        descripcion: values.descripcion,
        permisos: values.permisos || []
      });
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editing ? `Editar Rol: ${editing.nombre}` : 'Nuevo Rol'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText={editing ? 'Actualizar' : 'Crear'}
      confirmLoading={loading}
      destroyOnHidden
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="nombre"
          label="Nombre del Rol"
          rules={[{ required: true, message: 'Requerido' }, { max: 50, message: 'Máximo 50 caracteres' }]}
        >
          <Input placeholder="Ej: Vendedor, Bodeguero..." />
        </Form.Item>

        <Form.Item name="descripcion" label="Descripción">
          <TextArea rows={2} placeholder="Descripción opcional del rol" />
        </Form.Item>

        <Card title="Permisos" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="permisos"
            rules={[{ required: true, type: 'array', min: 1, message: 'Seleccione al menos un permiso' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 8]}>
                {permissions.map((perm) => (
                  <Col xs={12} sm={8} key={perm.idpermiso}>
                    <Checkbox value={perm.idpermiso}>
                      {perm.nombre}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
          {permissions.length === 0 && (
            <Text type="secondary">Cargando permisos...</Text>
          )}
        </Card>
      </Form>
    </Modal>
  );
};
