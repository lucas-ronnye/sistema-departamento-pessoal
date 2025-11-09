import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import {
  Typography,
  DatePicker,
  Card,
  Tag,
  Space,
  Button,
  Statistic,
  Descriptions,
  Modal,
  message,
  Divider,
} from 'antd'

type DCTFWebStatus = {
  competencia: string
  status: 'Em Andamento' | 'Confessado' | 'Pago'
  valorDebito: number
  darfDisponivel: boolean
  darfLinhaDigitavel?: string
}

type GuiaDARF = {
  competencia: string
  valor: number
  codigoReceita: string
  linhaDigitavel: string
}

const statusTagColor: Record<DCTFWebStatus['status'], string> = {
  'Em Andamento': 'processing',
  'Confessado': 'warning',
  'Pago': 'success',
}

const DCTFWebPage = () => {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<DCTFWebStatus | null>(null)
  const [competencia, setCompetencia] = useState<Dayjs | null>(null)
  const [emitModalOpen, setEmitModalOpen] = useState(false)
  const [guia, setGuia] = useState<GuiaDARF | null>(null)

  const fetchStatus = useCallback(async (comp?: string) => {
    setLoading(true)
    try {
      const response = await axios.get('/api/impostos/dctfweb', {
        params: comp ? { competencia: comp } : undefined,
      })
      setStatus(response.data)
      setCompetencia(dayjs(response.data.competencia))
    } catch (error) {
      message.warning('Mock não disponível, exibindo dados de exemplo.')
      const fallback: DCTFWebStatus = {
        competencia: comp || dayjs().format('YYYY-MM'),
        status: 'Em Andamento',
        valorDebito: 4500.75,
        darfDisponivel: false,
      }
      setStatus(fallback)
      setCompetencia(dayjs(fallback.competencia))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const onChangeCompetencia = (value: Dayjs | null) => {
    setCompetencia(value)
    const comp = value ? value.format('YYYY-MM') : undefined
    fetchStatus(comp)
  }

  const handleConsolidar = async () => {
    if (!competencia) return
    try {
      setLoading(true)
      const response = await axios.post('/api/impostos/dctfweb/consolidar', {
        competencia: competencia.format('YYYY-MM'),
      })
      setStatus(response.data)
      message.success('Apuração consolidada. DARF disponível.')
    } catch (error: any) {
      message.warning(
        error?.response?.data?.message || 'Mock indisponível, consolidando localmente.'
      )
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              status: 'Confessado',
              darfDisponivel: true,
              darfLinhaDigitavel:
                prev.darfLinhaDigitavel ||
                '8486.12345 67890.12345 67890 12345678901234',
            }
          : {
              competencia: competencia.format('YYYY-MM'),
              status: 'Confessado',
              valorDebito: 4500.75,
              darfDisponivel: true,
              darfLinhaDigitavel:
                '8486.12345 67890.12345 67890 12345678901234',
            }
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEmitir = async () => {
    try {
      const response = await axios.post('/api/impostos/dctfweb/emitir-darf')
      setGuia(response.data)
      setEmitModalOpen(true)
    } catch (error: any) {
      message.warning(
        error?.response?.data?.message || 'Mock indisponível, exibindo guia de exemplo.'
      )
      if (status?.darfDisponivel) {
        setGuia({
          competencia: status.competencia,
          valor: status.valorDebito,
          codigoReceita: '5976',
          linhaDigitavel:
            status.darfLinhaDigitavel ||
            '8486.12345 67890.12345 67890 12345678901234',
        })
        setEmitModalOpen(true)
      }
    }
  }

  const handleMarcarPago = async () => {
    try {
      const response = await axios.post('/api/impostos/dctfweb/marcar-pago')
      setStatus(response.data)
      message.success('Status atualizado para Pago.')
    } catch (error: any) {
      message.warning(
        error?.response?.data?.message || 'Mock indisponível, marcando como pago localmente.'
      )
      setStatus((prev) => (prev ? { ...prev, status: 'Pago' } : prev))
    }
  }

  return (
    <div>
      <Typography.Title level={2}>DCTFWeb (DARF)</Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          picker="month"
          value={competencia}
          onChange={onChangeCompetencia}
          allowClear={false}
        />
        <Button onClick={() => fetchStatus(competencia?.format('YYYY-MM'))}>
          Atualizar
        </Button>
        <Divider type="vertical" />
        <Button type="primary" onClick={handleConsolidar} disabled={loading}>
          Consolidar apuração
        </Button>
        <Button
          onClick={handleEmitir}
          disabled={loading || !status?.darfDisponivel}
        >
          Emitir DARF
        </Button>
        <Button
          danger
          onClick={handleMarcarPago}
          disabled={loading || status?.status === 'Pago'}
        >
          Marcar como Pago
        </Button>
      </Space>

      <Card loading={loading}>
        {status && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center">
              <Typography.Text strong>
                Competência: {dayjs(status.competencia).format('MM/YYYY')}
              </Typography.Text>
              <Tag color={statusTagColor[status.status]}>{status.status}</Tag>
            </Space>

            <Statistic
              title="Valor do Débito"
              precision={2}
              prefix="R$"
              value={status.valorDebito}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="DARF disponível">
                {status.darfDisponivel ? 'Sim' : 'Não'}
              </Descriptions.Item>
              {status.darfDisponivel && status.darfLinhaDigitavel && (
                <Descriptions.Item label="Linha digitável">
                  {status.darfLinhaDigitavel}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Card>

      <Modal
        title="Guia DARF"
        open={emitModalOpen}
        onCancel={() => setEmitModalOpen(false)}
        footer={<Button onClick={() => setEmitModalOpen(false)}>Fechar</Button>}
        destroyOnHidden
      >
        {guia && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Competência">
              {dayjs(guia.competencia).format('MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Código de Receita">
              {guia.codigoReceita}
            </Descriptions.Item>
            <Descriptions.Item label="Valor">
              {`R$ ${guia.valor.toFixed(2)}`}
            </Descriptions.Item>
            <Descriptions.Item label="Linha digitável">
              {guia.linhaDigitavel}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DCTFWebPage
