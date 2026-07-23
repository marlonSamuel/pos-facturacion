import { useEffect, useState } from 'react';
import { Modal, Form, Input } from 'antd';
import type { ICategory } from '../../../interfaces/ICategory';

interface Props {
  open: boolean;
  editing: ICategory | null;
  onOk: (values: Partial<ICategory>) => Promise<void>;
  onCancel: () => void;
}

export const CategoryForm = ({ open, editing, onOk, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      await onOk(values);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editing ? 'Editar Categoría' : 'Nueva Categoría'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={editing ? 'Actualizar' : 'Crear'}
      confirmLoading={loading}
      destroyOnHidden
      width={420}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
