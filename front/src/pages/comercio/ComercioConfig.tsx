import { useContext, useEffect, useState } from 'react';
import { Card, Form, Input, Button, Upload, Typography, message, Spin, Divider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';
import api from '../../api/axios';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export const ComercioConfig = () => {
  const { comercioInfo, user } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (comercioInfo) {
      form.setFieldsValue({
        nombre: comercioInfo.nombre,
        direccion: comercioInfo.direccion,
        telefono: comercioInfo.telefono,
        email: comercioInfo.email,
      });
      if (comercioInfo.logo) {
        setLogoFile([{
          uid: '-1',
          name: 'logo',
          status: 'done',
          url: `${API_URL}/uploads/comercios/${comercioInfo.logo}`
        }]);
      }
    }
  }, [comercioInfo]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.append(k, String(v ?? '')));
      if (logoFile[0]?.originFileObj) {
        formData.append('logo', logoFile[0].originFileObj);
      }
      await api.put('/comercios/me', formData);
      message.success('Comercio actualizado correctamente');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Error al actualizar');
    }
    setSaving(false);
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo imágenes (jpg, png, gif, webp)');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  if (!user || user.idrol !== 1) {
    return <Card><Text type="danger">Solo administradores pueden acceder a esta configuración</Text></Card>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={3}>Configuración del Comercio</Title>
      <Text type="secondary">Actualiza la información general de tu comercio</Text>
      <Divider />
      <Card>
        <Spin spinning={!comercioInfo}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="nombre" label="Nombre del Comercio">
              <Input />
            </Form.Item>
            <Form.Item name="direccion" label="Dirección Principal">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="telefono" label="Teléfono">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input type="email" />
            </Form.Item>
            <Form.Item label="Logo del Comercio">
              <Upload
                listType="picture-card"
                fileList={logoFile}
                onChange={({ fileList }) => setLogoFile(fileList)}
                beforeUpload={beforeUpload}
                maxCount={1}
                accept="image/*"
                showUploadList={{ showPreviewIcon: false }}
              >
                {logoFile.length < 1 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 4, fontSize: 12 }}>Subir logo</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Guardar Cambios
            </Button>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};
