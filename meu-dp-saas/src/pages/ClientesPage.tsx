import { useEffect, useState } from 'react'
import { Button, Table, Typography, Space } from 'antd'
import axios from 'axios'

type Cliente = {
  id: number
  nome: string
  cnpj: string
  status: string
}

function ClientesPage() {
  const [data, setData] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios
      .get<Cliente[]>('/api/clientes')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Meus Clientes
        </Typography.Title>
        <Button type="primary">Novo Cliente</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 'max-content' }} />
    </Space>
  )
}

export default ClientesPage