import { useContext, useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Typography, App, Spin, Result } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/auth/AuthContext';
import { authService } from '../../services/authService';
import type { IComercioPublicInfo } from '../../interfaces/IAuth';

const { Text, Title } = Typography;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
const SLUG = (import.meta.env.VITE_COMERCIO_SLUG as string) || null;

export const LoginPage = () => {
  const { notification } = App.useApp();
  const { login, errorMessage, removeError } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [comercio, setComercio] = useState<IComercioPublicInfo | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [slugError, setSlugError] = useState(false);

  useEffect(() => {
    if (!SLUG) {
      setSlugError(true);
      setBrandLoading(false);
      return;
    }
    authService.getComercioInfo(SLUG)
      .then(setComercio)
      .catch(() => { setSlugError(true); setComercio(null); })
      .finally(() => setBrandLoading(false));
  }, []);

  useEffect(() => {
    if (errorMessage) {
      notification.error({
        title: 'Error de inicio de sesión',
        description: errorMessage,
        duration: 5,
        style: { borderRadius: 8 }
      });
      removeError();
      setLoading(false);
    }
  }, [errorMessage]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    await login({ ...values, slug: SLUG || undefined });
  };

  // Pantalla de error si no se detecta comercio
  if (slugError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Card style={{ maxWidth: 480, textAlign: 'center', borderRadius: 12 }}>
          <Result
            status="404"
            title="Comercio no encontrado"
            subTitle="No se pudo identificar el comercio. Verifique la URL o contacte al administrador."
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Fondo decorativo */}
      <div style={styles.bgOverlay} />

      <Row justify="center" align="middle" style={{ minHeight: '100vh', width: '100%' }}>
        <Col xs={22} sm={18} md={12} lg={8} xl={6}>
          <Card
            styles={{
              body: { padding: '32px 32px 24px' }
            }}
          >
            {/* Logo */}
            {brandLoading ? <div style={{ textAlign:'center', padding:20 }}><Spin /></div> : <>
            <div style={styles.logoContainer}>
              {comercio?.logo ? (
                <div style={{ width: 100, height: 100, margin: '0 auto 8px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={`${API_URL}/uploads/comercios/${comercio.logo}`}
                    alt={comercio.nombre}
                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div style={{ ...styles.logoIcon, background: comercio?.color_primario || 'var(--blue-primary)' }}>
                  <span style={{ fontSize: 36, color: '#fff', fontWeight: 'bold' }}>
                    {(comercio?.nombre || 'N')[0]}
                  </span>
                </div>
              )}
              <Title level={3} style={{ margin: '8px 0 0 0', color: 'var(--blue-dark)', fontWeight: 700 }}>
                {comercio?.nombre || 'NEW HORIZON'}
              </Title>
              <Text type="secondary" style={{ fontSize: 13, letterSpacing: 1 }}>
                SISTEMA DE FACTURACIÓN
              </Text>
            </div>
            </>}

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              style={{ marginTop: 32 }}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Ingrese su usuario' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Usuario"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Ingrese su contraseña' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Contraseña"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  INICIAR SESIÓN
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                &copy; {new Date().getFullYear()} New Horizon. Todos los derechos reservados.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1a3a5c 40%, #0d2137 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  bgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(25, 118, 210, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(66, 165, 245, 0.08) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  logoContainer: {
    textAlign: 'center' as const
  },
  logoIcon: {
    width: 72, height: 72,
    borderRadius: 20,
    background: 'linear-gradient(135deg, var(--blue-primary) 0%, var(--sidebar-bg) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 8px 24px rgba(21, 101, 192, 0.35)'
  }
};
