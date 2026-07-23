import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { userService } from '../../services/userService';

interface Props {
  open: boolean;
  userId: number;
  userName: string;
  onCancel: () => void;
}

export const ChangePasswordModal = ({ open, userId, userName, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await userService.changePassword(userId, values.clave_actual, values.clave_nueva);
      message.success('Contraseña actualizada correctamente');
      form.resetFields();
      onCancel();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al cambiar contraseña';
      if (msg.includes('no es correcta')) {
        message.error('La contraseña actual no es correcta');
      } else {
        message.error(msg);
      }
    }
    setLoading(false);
  };

  return (
    <Modal
      title={<><LockOutlined /> Cambiar Contraseña — {userName}</>}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText="Cambiar Contraseña"
      confirmLoading={loading}
      destroyOnHidden
      width={400}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="clave_actual"
          label="Contraseña Actual"
          rules={[{ required: true, message: 'Requerida' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="clave_nueva"
          label="Nueva Contraseña"
          rules={[
            { required: true, message: 'Requerida' },
            { min: 4, message: 'Mínimo 4 caracteres' }
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmar"
          label="Confirmar Nueva Contraseña"
          dependencies={['clave_nueva']}
          rules={[
            { required: true, message: 'Confirme la contraseña' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('clave_nueva') === value) return Promise.resolve();
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              }
            })
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};
