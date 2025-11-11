import { Card, Typography, Form, Input, Button, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../core/AuthContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [form] = Form.useForm()
  const { login, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success('Login realizado')
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      message.error('Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <Card className="login-card" hoverable>
        <div className="login-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Logo transparente do public com maior destaque */}
            <img
              src="/logo-rh-digital.png?v=3"
              alt="RH Digital"
              style={{ height: 200 }}
              onError={(e) => { e.currentTarget.src = '/logo-rh-digital-512.png?v=3' }}
            />
          </div>
          <Typography.Text className="login-slogan">Seu RH sempre conectado. </Typography.Text>
          <Typography.Text className="subtitle">Bem-vindo! Faça login para continuar.</Typography.Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Usuário"
            name="username"
            rules={[{ required: true, message: 'Informe o usuário' }]}
          >
            <Input placeholder="Seu usuário" prefix={<UserOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: 'Informe a senha' }]}
          >
            <Input.Password placeholder="Sua senha" prefix={<LockOutlined />} size="large" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Checkbox>Lembrar-me</Checkbox>
              <Typography.Link href="#">Esqueci minha senha</Typography.Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage