import { useEffect, useState } from 'react'
import { List, Typography, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import axios from 'axios'

type HoleriteItem = { id: number; mes: string }

function HoleritesPage() {
  const [data, setData] = useState<HoleriteItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios
      .get<HoleriteItem[]>('/api/holerites')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <List
      header={<Typography.Title level={4} style={{ margin: 0 }}>Contracheques</Typography.Title>}
      bordered
      loading={loading}
      dataSource={data}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button key="download" icon={<DownloadOutlined />} size="small">Download</Button>
          ]}
        >
          {item.mes}
        </List.Item>
      )}
    />
  )
}

export default HoleritesPage