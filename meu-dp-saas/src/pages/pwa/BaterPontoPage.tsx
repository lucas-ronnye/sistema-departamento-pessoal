import { useEffect, useMemo, useState } from 'react'
import { Space, Typography, Button, message, Form, Select, Input, Card, Table, Tag, Grid } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import axios from 'axios'
import { useAuth } from '../../core/AuthContext'

function BaterPontoPage() {
  const [now, setNow] = useState<string>(new Date().toLocaleTimeString())
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [marcacoes, setMarcacoes] = useState<Array<{ id: number; data: string; hora: string; tipo: string; lat?: number; lon?: number; observacao?: string }>>([])
  const [geo, setGeo] = useState<{ lat?: number; lon?: number; status: 'idle' | 'ok' | 'erro' }>(() => ({ status: 'idle' }))
  const { user } = useAuth()
  const screens = Grid.useBreakpoint()
  const stack = !screens.lg

  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchMarcacoesHoje = async () => {
    const hoje = dayjs().format('YYYY-MM-DD')
    try {
      const res = await axios.get(`/api/ponto/marcacoes?data=${hoje}${user?.id ? `&colaboradorId=${user.id}` : ''}`)
      setMarcacoes(res.data || [])
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    fetchMarcacoesHoje()
  }, [])

  const columns: ColumnsType<(typeof marcacoes)[number]> = useMemo(
    () => [
      { title: 'Hora', dataIndex: 'hora', key: 'hora', width: 90 },
      { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 160, render: (v: string) => <Tag color={v.includes('Entrada') ? 'green' : v.includes('Saída') ? 'volcano' : 'blue'}>{v}</Tag> },
      { title: 'Observação', dataIndex: 'observacao', key: 'observacao' },
      { title: 'Localização', key: 'local', width: 180, render: (_, r) => (r.lat && r.lon ? `${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}` : '—') },
    ],
    [marcacoes]
  )

  const allowedNextTypes = useMemo(() => {
    const last = marcacoes[marcacoes.length - 1]
    if (!last) return ['Entrada']
    switch (last.tipo) {
      case 'Entrada':
        return ['Início Intervalo', 'Saída']
      case 'Início Intervalo':
        return ['Fim Intervalo']
      case 'Fim Intervalo':
        return ['Saída']
      case 'Saída':
        return ['Entrada']
      default:
        return ['Entrada']
    }
  }, [marcacoes])

  useEffect(() => {
    if (allowedNextTypes.length) {
      form.setFieldsValue({ tipo: allowedNextTypes[0] })
    }
  }, [allowedNextTypes, form])

  const onBaterPonto = async () => {
    const { tipo, observacao } = form.getFieldsValue()
    if (!allowedNextTypes.includes(tipo)) {
      message.error(`Tipo não permitido agora. Próximos: ${allowedNextTypes.join(', ')}`)
      return
    }
    setLoading(true)
    const dataISO = new Date().toISOString()
    const post = async (lat?: number, lon?: number) => {
      try {
        await axios.post('/api/ponto/bater', { colaboradorId: user?.id || 1, lat, lon, data: dataISO, tipo, observacao })
        message.success('Ponto registrado com sucesso')
        await fetchMarcacoesHoje()
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Falha ao registrar ponto'
        message.error(msg)
      }
    }

    if (!navigator.geolocation) {
      setGeo({ status: 'erro' })
      await post()
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setGeo({ lat, lon, status: 'ok' })
        await post(lat, lon)
        setLoading(false)
      },
      async () => {
        setGeo({ status: 'erro' })
        await post()
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: stack ? 'column' : 'row', alignItems: stack ? 'stretch' : 'flex-start', justifyContent: 'center', gap: stack ? 16 : 24, minHeight: '60vh', width: '100%' }}>
      <Space direction="vertical" align="center" style={{ flex: 1, width: '100%' }}>
        <Typography.Title level={4}>Hora atual</Typography.Title>
        <Typography.Text style={{ fontSize: 28 }}>{now}</Typography.Text>

        <Card style={{ width: '100%', maxWidth: stack ? '100%' : 420 }}>
          <Form form={form} layout="vertical" initialValues={{ tipo: 'Entrada', observacao: '' }}>
            <Form.Item name="tipo" label="Tipo de marcação">
              <Select
                options={[
                  { value: 'Entrada', label: 'Entrada' },
                  { value: 'Saída', label: 'Saída' },
                  { value: 'Início Intervalo', label: 'Início Intervalo' },
                  { value: 'Fim Intervalo', label: 'Fim Intervalo' },
                ].map((opt) => ({ ...opt, disabled: !allowedNextTypes.includes(opt.value as string) }))}
              />
            </Form.Item>
            <Form.Item name="observacao" label="Observação">
              <Input placeholder="Opcional" maxLength={120} />
            </Form.Item>
            <Typography.Text type="secondary">Próximos permitidos: {allowedNextTypes.join(', ')}</Typography.Text>

            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={onBaterPonto}
                loading={loading}
                style={{ width: stack ? '100%' : 240, height: 48 }}
              >
                BATER PONTO
              </Button>
              <Typography.Text type={geo.status === 'erro' ? 'danger' : 'secondary'}>
                {geo.status === 'ok' && geo.lat && geo.lon
                  ? `Localização: ${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)}`
                  : geo.status === 'erro'
                  ? 'Batida sem localização'
                  : 'Aguardando localização...'}
              </Typography.Text>
            </Space>
          </Form>
        </Card>
      </Space>

      <Space direction="vertical" style={{ flex: 1, width: '100%' }}>
        <Card title="Minhas marcações de hoje">
          <Table rowKey="id" size="small" columns={columns} dataSource={marcacoes} pagination={false} scroll={{ x: 'max-content' }} />
        </Card>
        <Card title="Resumo do dia">
          <Space>
            <Typography.Text>Total de batidas: {marcacoes.length}</Typography.Text>
            {marcacoes.length > 0 && (
              <Typography.Text>
                Última: {marcacoes[marcacoes.length - 1].hora} · {marcacoes[marcacoes.length - 1].tipo}
              </Typography.Text>
            )}
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default BaterPontoPage