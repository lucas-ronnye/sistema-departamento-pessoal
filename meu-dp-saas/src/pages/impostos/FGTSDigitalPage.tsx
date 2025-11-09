import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import { Typography, Card, Tag, Space, Button, Statistic, Divider, message, DatePicker, Table } from 'antd'

type FGTSStatus = {
  competencia: string
  status: 'Aguardando' | 'Guia Gerada' | 'Pago'
  valorGuia: number
  linhaDigitavel?: string
}

type FgtsDetalheColab = {
  id: number
  nome: string
  cargo: string
  competencia: string
  salarioBruto: number
  baseFgts: number
  aliquotaFgts: number
  fgtsMes: number
}

type FgtsHistoricoItem = {
  competencia: string
  status: 'Aguardando' | 'Guia Gerada' | 'Pago'
  valorGuia: number
  linhaDigitavel?: string
}

const statusTagColor: Record<FGTSStatus['status'], string> = {
  'Aguardando': 'default',
  'Guia Gerada': 'processing',
  'Pago': 'success',
}

const { Title, Text, Link } = Typography

const FGTSDigitalPage = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FGTSStatus | null>(null)
  const [competencia, setCompetencia] = useState<Dayjs | null>(null)
  
  const [detalhes, setDetalhes] = useState<FgtsDetalheColab[]>([])
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [historico, setHistorico] = useState<FgtsHistoricoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  const resumo = useMemo(() => {
    const totalFgts = detalhes.reduce((acc, d) => acc + Number(d.fgtsMes || 0), 0)
    const totalSalario = detalhes.reduce((acc, d) => acc + Number(d.salarioBruto || 0), 0)
    const count = detalhes.length
    const aliquota = detalhes.length ? detalhes[0].aliquotaFgts : undefined
    return { totalFgts, totalSalario, count, aliquota }
  }, [detalhes])

  const fetchStatus = useCallback(async (comp?: string) => {
    setLoading(true)
    try {
      const res = await axios.get<FGTSStatus>('/api/impostos/fgts-digital', {
        params: comp ? { competencia: comp } : undefined,
      })
      setData(res.data)
      setCompetencia(dayjs(res.data.competencia))
    } catch (error) {
      message.warning('Mock não disponível, exibindo dados de exemplo.')
      const fallback: FGTSStatus = {
        competencia: dayjs().format('YYYY-MM'),
        status: 'Guia Gerada',
        valorGuia: 1088.04,
        linhaDigitavel: undefined,
      }
      setData(fallback)
      setCompetencia(dayjs(fallback.competencia))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetalhes = useCallback(async (comp?: string) => {
    setLoadingDetalhes(true)
    try {
      const res = await axios.get('/api/impostos/fgts-digital/detalhes', {
        params: comp ? { competencia: comp } : undefined,
      })
      setDetalhes(res.data?.detalhes || [])
    } catch {
      setDetalhes([])
    } finally {
      setLoadingDetalhes(false)
    }
  }, [])

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    try {
      const res = await axios.get<FgtsHistoricoItem[]>('/api/impostos/fgts-digital/historico')
      setHistorico(res.data || [])
    } catch {
      setHistorico([])
    } finally {
      setLoadingHistorico(false)
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      await fetchStatus()
      await fetchHistorico()
      const compStr = dayjs().format('YYYY-MM')
      await fetchDetalhes(compStr)
    }
    run()
  }, [fetchStatus])

  const competenciaFmt = data ? dayjs(data.competencia).isValid() ? dayjs(data.competencia).format('MM/YYYY') : data.competencia : '-'

  const onCompetenciaChange = (value: Dayjs | null) => {
    setCompetencia(value)
    const compStr = value ? value.format('YYYY-MM') : undefined
    fetchStatus(compStr)
    fetchDetalhes(compStr)
  }

  const emitirGuia = async () => {
    try {
      const compStr = competencia ? competencia.format('YYYY-MM') : undefined
      await axios.post('/api/impostos/fgts-digital/emitir-guia', compStr ? { competencia: compStr } : {})
      message.success('Guia do FGTS emitida com sucesso.')
      fetchStatus(compStr)
      fetchHistorico()
      fetchDetalhes(compStr)
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao emitir guia do FGTS.'
      message.error(msg)
    }
  }

  const marcarPago = async () => {
    try {
      await axios.post('/api/impostos/fgts-digital/marcar-pago')
      message.success('FGTS marcado como pago.')
      const compStr = competencia ? competencia.format('YYYY-MM') : undefined
      fetchStatus(compStr)
      fetchHistorico()
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Não foi possível marcar como pago.'
      message.error(msg)
    }
  }

  const copiarLinhaDigitavel = async () => {
    const ld = data?.linhaDigitavel
    if (!ld) {
      message.warning('Nenhuma linha digitável disponível.')
      return
    }
    try {
      await navigator.clipboard.writeText(ld)
      message.success('Linha digitável copiada para a área de transferência.')
    } catch {
      message.warning('Não foi possível copiar automaticamente. Copie manualmente.')
    }
  }

  const reemitirGuiaCompetencia = async (comp: string) => {
    try {
      await axios.post('/api/impostos/fgts-digital/emitir-guia', { competencia: comp })
      message.success(`Guia reemitida para ${dayjs(comp).isValid() ? dayjs(comp).format('MM/YYYY') : comp}.`)
      await fetchStatus(comp)
      await fetchHistorico()
      await fetchDetalhes(comp)
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao reemitir guia.'
      message.error(msg)
    }
  }

  const verDetalhesCompetencia = async (comp: string) => {
    setCompetencia(dayjs(comp))
    await fetchStatus(comp)
    await fetchDetalhes(comp)
  }

  const exportarDetalhesCSV = () => {
    if (!detalhes?.length) {
      message.info('Não há dados para exportar.')
      return
    }
    const headers = ['ID','Nome','Cargo','Competência','Salário Bruto','Base FGTS','Alíquota FGTS','FGTS do Mês']
    const rows = detalhes.map(d => [
      d.id,
      d.nome,
      d.cargo,
      d.competencia,
      d.salarioBruto.toFixed(2),
      d.baseFgts.toFixed(2),
      d.aliquotaFgts.toFixed(1),
      d.fgtsMes.toFixed(2)
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val)).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const compStr = competencia ? competencia.format('YYYY-MM') : dayjs().format('YYYY-MM')
    a.download = `fgts-detalhes-${compStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={3}>FGTS Digital</Title>
      <Card loading={loading}>
        <Space style={{ marginBottom: 16 }}>
          <Text>Competência:</Text>
          <DatePicker picker="month" value={competencia ?? undefined} onChange={onCompetenciaChange} />
        </Space>
        <Space size="large" wrap>
          <Statistic title="Competência" value={competenciaFmt} />
          <Statistic title="Valor da Guia" prefix="R$" value={data?.valorGuia ?? 0} precision={2} />
          <Space>
            <Text>Status:</Text>
            <Tag color={data ? statusTagColor[data.status] : 'default'}>{data?.status ?? '—'}</Tag>
          </Space>
        </Space>

        <Divider />

        <Space>
          <Button onClick={() => fetchStatus(competencia ? competencia.format('YYYY-MM') : undefined)}>Atualizar</Button>
          <Button type="primary" onClick={emitirGuia}>Emitir guia</Button>
          <Button disabled={data?.status !== 'Guia Gerada'} onClick={marcarPago}>Marcar pago</Button>
          <Button type="link">
            <Link href="https://www.gov.br/trabalho-e-emprego/pt-br/servicos/fgts" target="_blank" rel="noopener noreferrer">
              Abrir portal FGTS Digital
            </Link>
          </Button>
        </Space>

        {data?.linhaDigitavel && (
          <Divider />
        )}
        {data?.linhaDigitavel && (
          <Space>
            <Text type="secondary">Linha digitável: {data.linhaDigitavel}</Text>
            <Button size="small" onClick={copiarLinhaDigitavel}>Copiar</Button>
          </Space>
        )}
      </Card>

      <Card title="Resumo da competência">
        <Space size="large" wrap>
          <Statistic title="Total FGTS" prefix="R$" value={resumo.totalFgts} precision={2} />
          <Statistic title="Colaboradores ativos" value={resumo.count} />
          <Statistic title="Base salarial" prefix="R$" value={resumo.totalSalario} precision={2} />
          {resumo.aliquota !== undefined && (
            <Statistic title="Alíquota FGTS" value={resumo.aliquota} suffix="%" precision={1} />
          )}
        </Space>
      </Card>

      <Card title="Detalhamento por colaborador" loading={loadingDetalhes} extra={<Button size="small" onClick={exportarDetalhesCSV}>Exportar CSV</Button>}>
        <Table
          size="small"
          rowKey="id"
          dataSource={detalhes}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Nome', dataIndex: 'nome' },
            { title: 'Cargo', dataIndex: 'cargo' },
            { title: 'Salário Bruto', dataIndex: 'salarioBruto', render: (v: number) => `R$ ${v.toFixed(2)}` },
            { title: 'Alíquota FGTS', dataIndex: 'aliquotaFgts', render: (v: number) => `${v.toFixed(1)}%` },
            { title: 'FGTS do Mês', dataIndex: 'fgtsMes', render: (v: number) => `R$ ${v.toFixed(2)}` },
          ]}
        />
      </Card>

      <Card title="Histórico de competências" loading={loadingHistorico}>
        <Table
          size="small"
          rowKey={(row) => `${row.competencia}-${row.linhaDigitavel ?? ''}`}
          dataSource={historico}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Competência', dataIndex: 'competencia', render: (c: string) => dayjs(c).isValid() ? dayjs(c).format('MM/YYYY') : c },
            { title: 'Valor da Guia', dataIndex: 'valorGuia', render: (v: number) => `R$ ${v.toFixed(2)}` },
            { title: 'Status', dataIndex: 'status', render: (s: FGTSStatus['status']) => <Tag color={statusTagColor[s]}>{s}</Tag> },
            { title: 'Linha Digitável', dataIndex: 'linhaDigitavel', render: (ld?: string) => ld ? <Text type="secondary">{ld}</Text> : '—' },
            { title: 'Ações', key: 'acoes', render: (_: any, row: FgtsHistoricoItem) => (
              <Space>
                <Button size="small" onClick={() => verDetalhesCompetencia(row.competencia)}>Ver detalhes</Button>
                <Button size="small" type="primary" disabled={row.status === 'Pago'} onClick={() => reemitirGuiaCompetencia(row.competencia)}>
                  {row.status === 'Aguardando' ? 'Emitir guia' : 'Reemitir guia'}
                </Button>
              </Space>
            ) },
          ]}
        />
      </Card>
    </Space>
  )
}

export default FGTSDigitalPage