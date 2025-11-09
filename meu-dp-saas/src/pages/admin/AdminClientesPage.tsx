import { useEffect, useState } from 'react'
import { Button, Table, Typography, Space, Modal, Form, Input, Select, message } from 'antd'
import axios from 'axios'

type Cliente = {
  id: number
  nome: string
  cnpj: string
  status: string
  dominio?: string
}

function AdminClientesPage() {
  const [data, setData] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editDomainOpen, setEditDomainOpen] = useState<Cliente | null>(null)
  const [createForm] = Form.useForm<Cliente>()
  const [domainForm] = Form.useForm<{ dominio: string }>()

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const res = await axios.get<Cliente[]>('/api/clientes')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const onCreate = async (values: Cliente) => {
    try {
      await axios.post('/api/clientes', {
        nome: values.nome,
        cnpj: values.cnpj,
        status: values.status || 'Ativo',
        dominio: values.dominio,
      })
      message.success('Cliente cadastrado')
      setCreateOpen(false)
      createForm.resetFields()
      fetchClientes()
    } catch (e) {
      message.error('Falha ao cadastrar cliente')
    }
  }

  const onOpenEditDomain = (record: Cliente) => {
    setEditDomainOpen(record)
  }

  const onSaveDomain = async (vals: { dominio: string }) => {
    if (!editDomainOpen) return
    try {
      await axios.put(`/api/clientes/${editDomainOpen.id}`, { dominio: vals.dominio })
      message.success('Domínio atualizado')
      setEditDomainOpen(null)
      fetchClientes()
    } catch (e) {
      message.error('Falha ao atualizar domínio')
    }
  }

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Domínio', dataIndex: 'dominio', key: 'dominio' },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Cliente) => (
        <Space>
          <Button onClick={() => onOpenEditDomain(record)}>Editar Domínio</Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          App Admin · Clientes & Domínios
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>Novo Cliente</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 'max-content' }} />

      <Modal open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} title="Cadastrar Cliente" destroyOnHidden>
        <Form form={createForm} layout="vertical" onFinish={onCreate}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="cnpj" label="CNPJ" rules={[{ required: true, message: 'Informe o CNPJ' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Ativo"> 
            <Select options={[{ label: 'Ativo', value: 'Ativo' }, { label: 'Inativo', value: 'Inativo' }]} />
          </Form.Item>
          <Form.Item name="dominio" label="Domínio"> 
            <Input placeholder="empresa.example.com" />
          </Form.Item>
          <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Salvar</Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={!!editDomainOpen} onCancel={() => setEditDomainOpen(null)} footer={null} title="Atualizar Domínio" destroyOnHidden>
        <Form form={domainForm} layout="vertical" onFinish={onSaveDomain} initialValues={{ dominio: editDomainOpen?.dominio || '' }}>
          <Form.Item name="dominio" label="Domínio" rules={[{ required: true, message: 'Informe o domínio' }]}> 
            <Input placeholder="empresa.example.com" />
          </Form.Item>
          <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setEditDomainOpen(null)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Salvar</Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  )
}

export default AdminClientesPage