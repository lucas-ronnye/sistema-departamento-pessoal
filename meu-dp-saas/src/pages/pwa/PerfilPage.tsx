import { useEffect } from 'react'
import { Avatar, Breadcrumb, Button, Card, Col, Form, Input, Row, Space, Tabs, Typography, message } from 'antd'
import { BankOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useAuth } from '../../core/AuthContext'

const { Title, Paragraph } = Typography

type PerfilDados = {
  nome?: string
  email?: string
  telefone?: string
}

type BancariosDados = {
  banco?: string
  agencia?: string
  conta?: string
  tipo?: 'corrente' | 'poupanca'
}

function PerfilPage() {
  const { user, token } = useAuth()
  const [formDados] = Form.useForm<PerfilDados>()
  const [formBancarios] = Form.useForm<BancariosDados>()
  const [formSenha] = Form.useForm<{ atual: string; nova: string; confirmar: string }>()

  useEffect(() => {
    // Preenche com dados do usuário quando disponíveis
    formDados.setFieldsValue({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: (user as any)?.telefone || '',
    })

    // Carrega rascunhos locais caso existam
    const draftDados = localStorage.getItem('perfilDraft')
    if (draftDados) {
      try {
        formDados.setFieldsValue(JSON.parse(draftDados))
      } catch {}
    }

    const draftBank = localStorage.getItem('perfilBankDraft')
    if (draftBank) {
      try {
        formBancarios.setFieldsValue(JSON.parse(draftBank))
      } catch {}
    }
  }, [user, formDados, formBancarios])

  const saveDados = async (values: PerfilDados) => {
    try {
      await axios.put('/api/auth/me', values, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Dados atualizados com sucesso')
      localStorage.removeItem('perfilDraft')
    } catch (e) {
      localStorage.setItem('perfilDraft', JSON.stringify(values))
      message.warning('API indisponível. Alterações salvas localmente como rascunho.')
    }
  }

  const saveBancarios = async (values: BancariosDados) => {
    try {
      await axios.put('/api/auth/me/bancarios', values, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Dados bancários atualizados com sucesso')
      localStorage.removeItem('perfilBankDraft')
    } catch (e) {
      localStorage.setItem('perfilBankDraft', JSON.stringify(values))
      message.warning('API indisponível. Dados bancários salvos localmente como rascunho.')
    }
  }

  const changePassword = async (values: { atual: string; nova: string; confirmar: string }) => {
    if (values.nova !== values.confirmar) {
      message.error('A confirmação da nova senha não confere')
      return
    }
    try {
      await axios.post(
        '/api/auth/change-password',
        { currentPassword: values.atual, newPassword: values.nova },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      message.success('Senha alterada com sucesso')
      formSenha.resetFields()
    } catch (e) {
      message.error('Falha ao alterar a senha. Verifique a senha atual ou tente novamente mais tarde.')
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Meu Perfil' }]} />
      <Card className="pwa-perfil-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6} md={4} style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: 'var(--brand-primary)' }} />
          </Col>
          <Col xs={24} sm={18} md={20}>
            <Title level={4} style={{ marginBottom: 4 }}>{user?.nome || 'Colaborador'}</Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>{user?.email || 'email@empresa.com'}</Paragraph>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs defaultActiveKey="dados"
          items={[
            {
              key: 'dados',
              label: 'Dados Pessoais',
              children: (
                <Form form={formDados} layout="vertical" onFinish={saveDados}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}> 
                        <Input prefix={<UserOutlined />} placeholder="Seu nome" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="email" label="E-mail" rules={[{ type: 'email', message: 'E-mail inválido' }]}> 
                        <Input prefix={<MailOutlined />} placeholder="seu.email@empresa.com" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="telefone" label="Telefone">
                        <Input prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formDados.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Salvar</Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: 'bancarios',
              label: 'Dados Bancários',
              children: (
                <Form form={formBancarios} layout="vertical" onFinish={saveBancarios}>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="banco" label="Banco" rules={[{ required: true, message: 'Informe o banco' }]}> 
                        <Input prefix={<BankOutlined />} placeholder="Ex: 001 - Banco do Brasil" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item name="agencia" label="Agência" rules={[{ required: true, message: 'Informe a agência' }]}>
                        <Input placeholder="0000" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item name="conta" label="Conta" rules={[{ required: true, message: 'Informe a conta' }]}>
                        <Input placeholder="000000-0" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="tipo" label="Tipo de Conta">
                        <Input placeholder="corrente ou poupança" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formBancarios.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Salvar</Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: 'seguranca',
              label: 'Segurança',
              children: (
                <Form form={formSenha} layout="vertical" onFinish={changePassword}>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item name="atual" label="Senha atual" rules={[{ required: true, message: 'Informe a senha atual' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="nova" label="Nova senha" rules={[{ required: true, message: 'Informe a nova senha' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="confirmar" label="Confirmar nova senha" rules={[{ required: true, message: 'Confirme a nova senha' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formSenha.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Alterar senha</Button>
                  </Space>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}

export default PerfilPage