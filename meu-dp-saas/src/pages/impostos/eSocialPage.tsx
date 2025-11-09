import { useEffect, useState } from 'react'
import { Table, Tag, Typography, Space } from 'antd'
import axios from 'axios'

type EventoESocial = {
  id: number
  tipo: string
  descricao: string
  status: 'Pendente' | 'Enviado'
  data: string
}

function ESocialPage() {
  const [data, setData] = useState<EventoESocial[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await axios.get<EventoESocial[]>('/api/esocial/eventos')
        setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const columns = [
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Data', dataIndex: 'data', key: 'data' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: EventoESocial['status']) => (
        <Tag color={v === 'Enviado' ? 'green' : 'orange'}>{v}</Tag>
      ),
    },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={3} style={{ margin: 0 }}>eSocial</Typography.Title>
      <Table rowKey="id" columns={columns as any} dataSource={data} loading={loading} scroll={{ x: 'max-content' }} />
    </Space>
  )
}

export default ESocialPage