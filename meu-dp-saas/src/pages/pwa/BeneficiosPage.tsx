import { useCallback, useEffect, useMemo, useState } from 'react'
import { Breadcrumb, Button, Card, Form, Input, List, Modal, Select, Space, Tag, Typography, message } from 'antd'
import axios from 'axios'
import { useAuth } from '../../core/AuthContext'

type Beneficio = {
  key: React.Key
  colaboradorId: number
  colaboradorNome: string
  tipo: 'VT' | 'VR' | 'VA' | 'Plano de Saúde'
  valor: number
  status: 'ativo' | 'inativo'
}

function BeneficiosPage() {
  const { user, token } = useAuth()
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedBeneficio, setSelectedBeneficio] = useState<Beneficio | null>(null)
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get<Beneficio[]>('/api/beneficios', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      const todos = res.data || []
      const filtrados = user?.id ? todos.filter((b) => b.colaboradorId === user.id) : todos
      setBeneficios(filtrados)
    } catch (e) {
      // Fallback mock simples
      const mock: Beneficio[] = [
        { key: 1, colaboradorId: user?.id || 1, colaboradorNome: user?.nome || 'Colaborador', tipo: 'VT', valor: 180, status: 'ativo' },
        { key: 2, colaboradorId: user?.id || 1, colaboradorNome: user?.nome || 'Colaborador', tipo: 'VR', valor: 700, status: 'ativo' },
        { key: 3, colaboradorId: user?.id || 1, colaboradorNome: user?.nome || 'Colaborador', tipo: 'Plano de Saúde', valor: 350, status: 'ativo' },
      ]
      setBeneficios(mock)
      message.warning('API indisponível. Benefícios exibidos com dados de exemplo.')
    } finally {
      setLoading(false)
    }
  }, [token, user?.id, user?.nome])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const abrirAjuste = (b: Beneficio) => {
    setSelectedBeneficio(b)
    setIsModalVisible(true)
    form.resetFields()
  }

  const enviarAjuste = async (values: any) => {
    const payload = { beneficioKey: selectedBeneficio?.key, tipoAjuste: values.tipoAjuste, detalhes: values.detalhes }
    try {
      await axios.post('/api/solicitacoes/beneficios-ajuste', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Solicitação de ajuste enviada')
      setIsModalVisible(false)
    } catch (e) {
      message.warning('API indisponível. Ajuste salvo como rascunho local.')
      localStorage.setItem('solicitacao_beneficio_ajuste_draft', JSON.stringify(payload))
      setIsModalVisible(false)
    }
  }

  const totalMensal = useMemo(() => beneficios.reduce((acc, b) => acc + (b.status === 'ativo' ? b.valor : 0), 0), [beneficios])

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Meus Benefícios' }]} />
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Benefícios Ativos</Typography.Title>
          <Typography.Text strong>Total mensal: R$ {totalMensal.toFixed(2)}</Typography.Text>
        </Space>
      </Card>

      <List
        bordered
        loading={loading}
        dataSource={beneficios}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button key="ajuste" size="small" onClick={() => abrirAjuste(item)}>Solicitar ajuste</Button>,
            ]}
          >
            <Space>
              <Tag color={item.tipo === 'VT' ? 'geekblue' : item.tipo === 'VR' ? 'purple' : item.tipo === 'VA' ? 'gold' : 'green'}>{item.tipo}</Tag>
              <Typography.Text>R$ {item.valor.toFixed(2)}</Typography.Text>
              <Tag color={item.status === 'ativo' ? 'green' : 'red'}>{item.status.toUpperCase()}</Tag>
            </Space>
          </List.Item>
        )}
      />

      <Modal
        title={`Ajuste de benefício: ${selectedBeneficio?.tipo || ''}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={enviarAjuste}>
          <Form.Item name="tipoAjuste" label="Tipo de ajuste" rules={[{ required: true }]}> 
            <Select
              options={[
                { value: 'alteracao_valor', label: 'Alteração de valor' },
                { value: 'troca_tipo', label: 'Troca de tipo' },
                { value: 'cancelamento', label: 'Cancelamento' },
              ]}
            />
          </Form.Item>
          <Form.Item name="detalhes" label="Detalhes" rules={[{ required: true, message: 'Descreva o motivo' }]}> 
            <Input.TextArea rows={4} placeholder="Explique o motivo do ajuste" />
          </Form.Item>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsModalVisible(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Enviar</Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  )
}

export default BeneficiosPage