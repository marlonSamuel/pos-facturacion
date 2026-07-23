import { useContext, useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Avatar, Typography, Descriptions, Divider, Form, Input, Button, message, Spin, Tag, Space, Tabs, Grid } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  SolutionOutlined,
  SaveOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export const ProfilePage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        nombre: user.nombre,
        tipo_documento: user.tipo_documento,
        num_documento: user.num_documento,
        telefono: user.telefono,
        direccion: user.direccion
      });
    }
  }, [user]);

  const currentAvatar = avatarPreview || (user?.imagen && user?.imagen !== 'default.png'
    ? `${API_URL}/uploads/users/${user.imagen}`
    : null);

  const handleAvatarChange = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isImage) { message.warning('Solo imágenes'); return false; }
    if (!isLt2M) { message.warning('Máximo 2MB'); return false; }
    setAvatarPreview(URL.createObjectURL(file));
    return false;
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileLoading(true);
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.append(k, String(v ?? '')));
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) formData.append('imagen', fileInput.files[0]);

      const res = await api.put('/profile', formData);
      if (updateUser) updateUser(res.data);
      message.success('Perfil actualizado');
      setAvatarPreview(null);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Error al actualizar');
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      await api.put('/profile/change-password', {
        clave_actual: values.clave_actual,
        clave_nueva: values.clave_nueva
      });
      message.success('Contraseña actualizada');
      passwordForm.resetFields();
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Error al cambiar contraseña');
    }
    setPasswordLoading(false);
  };

  if (!user) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  const avatarSection = (
    <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onClick={() => fileInputRef.current?.click()}>
      <Avatar
        size={140}
        src={currentAvatar}
        icon={!currentAvatar ? <UserOutlined /> : undefined}
        style={{
          background: 'var(--blue-primary)',
          border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'opacity 0.3s'
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        background: 'var(--blue-primary)', borderRadius: '50%',
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) handleAvatarChange(e.target.files[0]); }}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'info',
      label: <span><UserOutlined /> Información</span>,
      children: (
        <Row gutter={[32, 24]}>
          <Col xs={24} md={10} style={{ textAlign: 'center' }}>
            {avatarSection}
            <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>{user.nombre}</Title>
            <Space>
              {user.rol ? <Tag color="blue">{user.rol}</Tag> : <Tag>-</Tag>}
              <Tag icon={user.condicion === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                color={user.condicion === 1 ? 'success' : 'error'}>
                {user.condicion === 1 ? 'Activo' : 'Inactivo'}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} md={14}>
            <Descriptions column={1} size="small" colon={false}
              styles={{ label: { color: '#8c8c8c', fontWeight: 500, paddingRight: 24, whiteSpace: 'nowrap' } }}>
              <Descriptions.Item label={<><IdcardOutlined style={{ marginRight: 6 }} />Login</>}>
                <Text strong>{user.login}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined style={{ marginRight: 6 }} />Email</>}>
                {user.email || <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Tipo Doc.">{user.tipo_documento}</Descriptions.Item>
              <Descriptions.Item label="No. Doc.">{user.num_documento}</Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined style={{ marginRight: 6 }} />Teléfono</>}>
                {user.telefono || <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label={<><SolutionOutlined style={{ marginRight: 6 }} />Rol</>}>
                {user.rol || <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined style={{ marginRight: 6 }} />Dirección</>}>
                {user.direccion || <Text type="secondary">—</Text>}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      )
    },
    {
      key: 'edit',
      label: <span><SaveOutlined /> Editar Perfil</span>,
      children: (
        <Row gutter={[32, 24]}>
          <Col xs={24} md={10} style={{ textAlign: 'center' }}>
            {avatarSection}
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              Haz clic en la foto para cambiarla
            </Text>
          </Col>
          <Col xs={24} md={14}>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
                <Input />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="tipo_documento" label="Tipo Doc." rules={[{ required: true }]}>
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="num_documento" label="No. Doc." rules={[{ required: true }]}>
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="telefono" label="Teléfono">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="Email">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="direccion" label="Dirección">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={profileLoading} block
                icon={<SaveOutlined />}>
                Guardar Cambios
              </Button>
            </Form>
          </Col>
        </Row>
      )
    },
    {
      key: 'security',
      label: <span><LockOutlined /> Seguridad</span>,
      children: (
        <Row justify="center">
          <Col xs={24} sm={20} md={14} lg={10}>
            {passwordChanged && (
              <div style={{
                textAlign: 'center', padding: 16, marginBottom: 16,
                background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8
              }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 8 }} />
                <Text strong style={{ color: '#52c41a' }}>Contraseña actualizada correctamente</Text>
              </div>
            )}
            <Card variant="borderless" style={{ boxShadow: 'none', padding: 0 }}>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Form.Item
                  name="clave_actual"
                  label="Contraseña Actual"
                  rules={[{ required: true, message: 'Ingrese su contraseña actual' }]}
                >
                  <Input.Password prefix={<KeyOutlined />} />
                </Form.Item>
                <Divider style={{ margin: '12px 0', fontSize: 12 }} plain>Nueva contraseña</Divider>
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
                  name="clave_confirm"
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
                <Button type="primary" htmlType="submit" loading={passwordLoading} block
                  icon={<LockOutlined />} style={{ marginTop: 8 }}>
                  Actualizar Contraseña
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        <UserOutlined /> Mi Perfil
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Gestiona tu información personal y seguridad
      </Text>

      <Card
        variant="borderless"
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)'
        }}
      >
        <Tabs
          items={tabItems}
          size="large"
          tabPlacement={isMobile ? 'top' : 'start'}
        />
      </Card>
    </div>
  );
};
