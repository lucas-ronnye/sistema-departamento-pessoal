import { Breadcrumb, Button, Card, DatePicker, Form, Input, Select, Space, Tabs, TimePicker, Upload, message, Table, Tag } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAuth } from '../../core/AuthContext'

const { RangePicker } = DatePicker
const { Dragger } = Upload

function SolicitacoesPage() {
  const { token } = useAuth()
  const [formFerias] = Form.useForm()
  const [formAjuste] = Form.useForm()
  const [formAtestado] = Form.useForm()

  const submitFerias = async (values: any) => {
    const payload = {
      tipo: values.tipo,
      periodo: [values.periodo?.[0]?.format('YYYY-MM-DD'), values.periodo?.[1]?.format('YYYY-MM-DD')],
      observacoes: values.observacoes,
    }
    try {
      await axios.post('/api/solicitacoes/ferias', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Solicitação de férias enviada')
      formFerias.resetFields()
    } catch (e) {
      message.warning('API indisponível. Solicitação registrada localmente.')
      localStorage.setItem('solicitacao_ferias_draft', JSON.stringify(payload))
    }
  }

  const submitAjuste = async (values: any) => {
    const payload = {
      data: values.data?.format('YYYY-MM-DD'),
      entrada: values.entrada?.format('HH:mm'),
      saida: values.saida?.format('HH:mm'),
      intervalo: values.intervalo?.format('HH:mm'),
      observacoes: values.observacoes,
    }
    try {
      await axios.post('/api/solicitacoes/ajuste-ponto', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Solicitação de ajuste de ponto enviada')
      formAjuste.resetFields()
    } catch (e) {
      message.warning('API indisponível. Solicitação registrada localmente.')
      localStorage.setItem('solicitacao_ajuste_draft', JSON.stringify(payload))
    }
  }

  const submitAtestado = async (values: any) => {
    const payload = {
      periodo: [values.periodo?.[0]?.format('YYYY-MM-DD'), values.periodo?.[1]?.format('YYYY-MM-DD')],
      cid: values.cid,
      observacoes: values.observacoes,
      arquivo: (values.arquivo?.fileList || []).map((f: any) => ({ name: f.name, size: f.size })),
    }
    try {
      await axios.post('/api/solicitacoes/afastamento', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      message.success('Atestado enviado para análise')
      formAtestado.resetFields()
    } catch (e) {
      message.warning('API indisponível. Solicitação registrada localmente.')
      localStorage.setItem('solicitacao_atestado_draft', JSON.stringify(payload))
    }
  }

  const columnsHistorico = [
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: (tipo: string) => <Tag color="blue">{tipo}</Tag> },
    { title: 'Detalhes', dataIndex: 'detalhes', key: 'detalhes' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Enviado' ? 'green' : 'orange'}>{s}</Tag> },
    { title: 'Data', dataIndex: 'data', key: 'data' },
  ]

  const historicoData = () => {
    const apiData: any[] = [] // tentar buscar da API, com fallback abaixo
    // drafts locais
    const dFerias = localStorage.getItem('solicitacao_ferias_draft')
    const dAjuste = localStorage.getItem('solicitacao_ajuste_draft')
    const dAtestado = localStorage.getItem('solicitacao_atestado_draft')
    const dBeneficioAjuste = localStorage.getItem('solicitacao_beneficio_ajuste_draft')
    const rows: any[] = []
    if (dFerias) {
      try {
        const v = JSON.parse(dFerias)
        rows.push({ key: 'draft_ferias', tipo: 'Férias', detalhes: `${v.tipo} ${v.periodo?.join(' a ')}`, status: 'Rascunho', data: new Date().toLocaleDateString() })
      } catch {}
    }
    if (dAjuste) {
      try {
        const v = JSON.parse(dAjuste)
        rows.push({ key: 'draft_ajuste', tipo: 'Ajuste de Ponto', detalhes: `${v.data} ${v.entrada || ''}-${v.saida || ''}`, status: 'Rascunho', data: new Date().toLocaleDateString() })
      } catch {}
    }
    if (dAtestado) {
      try {
        const v = JSON.parse(dAtestado)
        rows.push({ key: 'draft_atestado', tipo: 'Atestado/Afastamento', detalhes: `${v.periodo?.join(' a ')} CID:${v.cid || '-'}`, status: 'Rascunho', data: new Date().toLocaleDateString() })
      } catch {}
    }
    if (dBeneficioAjuste) {
      try {
        const v = JSON.parse(dBeneficioAjuste)
        rows.push({ key: 'draft_beneficio', tipo: 'Ajuste de Benefício', detalhes: `${v.tipoAjuste}`, status: 'Rascunho', data: new Date().toLocaleDateString() })
      } catch {}
    }
    return [...apiData, ...rows]
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Minhas Solicitações' }]} />
      <Card>
        <Tabs defaultActiveKey="ferias"
          items={[
            {
              key: 'ferias',
              label: 'Férias',
              children: (
                <Form form={formFerias} layout="vertical" onFinish={submitFerias} initialValues={{ tipo: 'integrais', periodo: [dayjs(), dayjs().add(30, 'day')] }}>
                  <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}> 
                    <Select options={[{ value: 'integrais', label: 'Integrais' }, { value: 'parciais', label: 'Parciais' }]} />
                  </Form.Item>
                  <Form.Item name="periodo" label="Período" rules={[{ required: true, message: 'Informe o período' }]}> 
                    <RangePicker format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item name="observacoes" label="Observações"> 
                    <Input.TextArea rows={3} placeholder="Detalhes adicionais" />
                  </Form.Item>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formFerias.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Solicitar</Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: 'ajuste',
              label: 'Ajuste de Ponto',
              children: (
                <Form form={formAjuste} layout="vertical" onFinish={submitAjuste}>
                  <Form.Item name="data" label="Data" rules={[{ required: true }]}> 
                    <DatePicker format="DD/MM/YYYY" />
                  </Form.Item>
                  <Space>
                    <Form.Item name="entrada" label="Entrada" rules={[{ required: true }]}> 
                      <TimePicker format="HH:mm" />
                    </Form.Item>
                    <Form.Item name="saida" label="Saída" rules={[{ required: true }]}> 
                      <TimePicker format="HH:mm" />
                    </Form.Item>
                    <Form.Item name="intervalo" label="Intervalo"> 
                      <TimePicker format="HH:mm" />
                    </Form.Item>
                  </Space>
                  <Form.Item name="observacoes" label="Observações"> 
                    <Input.TextArea rows={3} placeholder="Explique o motivo do ajuste" />
                  </Form.Item>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formAjuste.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Solicitar</Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: 'atestado',
              label: 'Atestado/Afastamento',
              children: (
                <Form form={formAtestado} layout="vertical" onFinish={submitAtestado}>
                  <Form.Item name="periodo" label="Período" rules={[{ required: true }]}> 
                    <RangePicker format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item name="cid" label="CID (opcional)"> 
                    <Input placeholder="Ex: J00" />
                  </Form.Item>
                  <Form.Item name="arquivo" label="Atestado médico" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
                    <Dragger beforeUpload={() => false} multiple={false} maxCount={1} accept=".pdf,.jpg,.png">
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">Clique ou arraste para anexar o atestado</p>
                      <p className="ant-upload-hint">PDF, JPG ou PNG até 5MB</p>
                    </Dragger>
                  </Form.Item>
                  <Form.Item name="observacoes" label="Observações"> 
                    <Input.TextArea rows={3} placeholder="Detalhes adicionais" />
                  </Form.Item>
                  <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => formAtestado.resetFields()}>Cancelar</Button>
                    <Button type="primary" htmlType="submit">Enviar</Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: 'historico',
              label: 'Histórico',
              children: (
                <Table
                  rowKey="key"
                  columns={columnsHistorico}
                  dataSource={historicoData()}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}

export default SolicitacoesPage