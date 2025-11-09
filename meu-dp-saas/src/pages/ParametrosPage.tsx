import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Form,
  InputNumber,
  Button,
  Space,
  Typography,
  Table,
  Modal,
  DatePicker,
  Card,
  message,
  Breadcrumb,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../core/AuthContext';

const { Title } = Typography;

// --- Interfaces ---
interface InssDataType {
  key: React.Key;
  de: number;
  ate: number | null;
  aliquota: number;
  vigencia: string; // Data como string vinda da API
}
interface IrrfDataType {
  key: React.Key;
  de: number;
  ate: number | null;
  aliquota: number;
  deducao: number;
  vigencia: string; // Data como string vinda da API
}

interface FonteOficial {
  nome: string;
  url: string;
  vigencia: string;
  observacao?: string;
}

function ParametrosPage() {
  const { user } = useAuth();
  const permissoes: string[] = Array.isArray(user?.permissoes) ? (user!.permissoes as string[]) : [];

  if (!permissoes.includes('editar_parametros')) {
    return (
      <Card>
        <Typography.Title level={3}>Acesso negado</Typography.Title>
        <Typography.Paragraph>
          Você não possui permissão para editar os parâmetros do sistema.
        </Typography.Paragraph>
      </Card>
    );
  }
  // --- Forms ---
  const [inssForm] = Form.useForm();
  const [irrfForm] = Form.useForm();
  const [geralForm] = Form.useForm();

  // --- Loading States ---
  const [loadingInss, setLoadingInss] = useState(true);
  const [loadingIrrf, setLoadingIrrf] = useState(true);
  const [loadingGeral, setLoadingGeral] = useState(true);
  const [updatingInssOfficial, setUpdatingInssOfficial] = useState(false);
  const [updatingIrrfOfficial, setUpdatingIrrfOfficial] = useState(false);
  const [updatingFgtsOfficial, setUpdatingFgtsOfficial] = useState(false);

  // --- Data States ---
  const [inssData, setInssData] = useState<InssDataType[]>([]);
  const [irrfData, setIrrfData] = useState<IrrfDataType[]>([]);
  const [fonteINSS, setFonteINSS] = useState<FonteOficial | null>(null);
  const [fonteIRRF, setFonteIRRF] = useState<FonteOficial | null>(null);
  const [fonteFGTS, setFonteFGTS] = useState<FonteOficial | null>(null);

  // --- Modal States ---
  const [isModalInssVisible, setIsModalInssVisible] = useState(false);
  const [editingInssRecord, setEditingInssRecord] = useState<InssDataType | null>(null);
  const [isModalIrrfVisible, setIsModalIrrfVisible] = useState(false);
  const [editingIrrfRecord, setEditingIrrfRecord] = useState<IrrfDataType | null>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoadingInss(true);
    setLoadingIrrf(true);
    setLoadingGeral(true);
    try {
      const [inssRes, irrfRes, geralRes] = await Promise.all([
        axios.get('/api/parametros/inss'),
        axios.get('/api/parametros/irrf'),
        axios.get('/api/parametros/geral'),
      ]);
      setInssData(inssRes.data);
      setIrrfData(irrfRes.data);
      geralForm.setFieldsValue({
        ...geralRes.data,
        vigenciaGeral: dayjs(geralRes.data.vigenciaGeral),
        aliquotaFgts: geralRes.data.aliquotaFgts,
        autoINSS: geralRes.data.autoINSS,
        autoIRRF: geralRes.data.autoIRRF,
        autoFGTS: geralRes.data.autoFGTS,
      });
    } catch (error) {
      message.error('Falha ao carregar os parâmetros.');
    } finally {
      setLoadingInss(false);
      setLoadingIrrf(false);
      setLoadingGeral(false);
    }
  }, [geralForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- INSS Handlers ---
  const showInssModal = (record?: InssDataType) => {
    setEditingInssRecord(record || null);
    inssForm.setFieldsValue(record ? { ...record, vigencia: dayjs(record.vigencia) } : {});
    setIsModalInssVisible(true);
  };
  const handleInssCancel = () => setIsModalInssVisible(false);
  const onInssFinish = async (values: any) => {
    const payload = { ...values, vigencia: values.vigencia.format('YYYY-MM-DD') };
    try {
      if (editingInssRecord) {
        await axios.put(`/api/parametros/inss/${editingInssRecord.key}`, payload);
        message.success('Faixa de INSS atualizada com sucesso!');
      } else {
        await axios.post('/api/parametros/inss', payload);
        message.success('Nova faixa de INSS adicionada!');
      }
      setIsModalInssVisible(false);
      fetchData(); // Recarrega os dados
    } catch {
      message.error('Falha ao salvar faixa de INSS.');
    }
  };
  const handleInssDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir esta faixa?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/parametros/inss/${key}`);
          message.info('Faixa de INSS removida.');
          fetchData(); // Recarrega os dados
        } catch {
          message.error('Falha ao remover faixa de INSS.');
        }
      },
    });
  };

  // --- IRRF Handlers ---
  const showIrrfModal = (record?: IrrfDataType) => {
    setEditingIrrfRecord(record || null);
    irrfForm.setFieldsValue(record ? { ...record, vigencia: dayjs(record.vigencia) } : {});
    setIsModalIrrfVisible(true);
  };
  const handleIrrfCancel = () => setIsModalIrrfVisible(false);
  const onIrrfFinish = async (values: any) => {
    const payload = { ...values, vigencia: values.vigencia.format('YYYY-MM-DD') };
    try {
      if (editingIrrfRecord) {
        await axios.put(`/api/parametros/irrf/${editingIrrfRecord.key}`, payload);
        message.success('Faixa de IRRF atualizada com sucesso!');
      } else {
        await axios.post('/api/parametros/irrf', payload);
        message.success('Nova faixa de IRRF adicionada!');
      }
      setIsModalIrrfVisible(false);
      fetchData();
    } catch {
      message.error('Falha ao salvar faixa de IRRF.');
    }
  };
  const handleIrrfDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir esta faixa?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/parametros/irrf/${key}`);
          message.info('Faixa de IRRF removida.');
          fetchData();
        } catch {
          message.error('Falha ao remover faixa de IRRF.');
        }
      },
    });
  };

  // --- Geral Handler ---
  const onGeralFinish = async (values: any) => {
    const payload = { ...values, vigenciaGeral: values.vigenciaGeral.format('YYYY-MM-DD') };
    try {
      await axios.post('/api/parametros/geral', payload);
      message.success('Parâmetros gerais salvos com sucesso!');
      fetchData();
    } catch {
      message.error('Falha ao salvar parâmetros gerais.');
    }
  };

  // --- Fonte Oficial Handlers ---
  const atualizarInssDaFonteOficial = async () => {
    setUpdatingInssOfficial(true);
    try {
      const res = await axios.get('/api/parametros/oficial/inss');
      const faixas = res.data?.faixas || [];
      await axios.post('/api/parametros/inss/bulk', { faixas });
      if (res.data?.fonte) {
        setFonteINSS(res.data.fonte as FonteOficial);
      }
      message.success('INSS atualizado da fonte oficial (Gov.br).');
      fetchData();
    } catch {
      message.error('Falha ao atualizar INSS da fonte oficial.');
    } finally {
      setUpdatingInssOfficial(false);
    }
  };

  const atualizarIrrfDaFonteOficial = async () => {
    setUpdatingIrrfOfficial(true);
    try {
      const res = await axios.get('/api/parametros/oficial/irrf');
      const faixas = res.data?.faixas || [];
      await axios.post('/api/parametros/irrf/bulk', { faixas });
      if (res.data?.fonte) {
        setFonteIRRF(res.data.fonte as FonteOficial);
      }
      message.success('IRRF atualizado da fonte oficial (Receita Federal).');
      fetchData();
    } catch {
      message.error('Falha ao atualizar IRRF da fonte oficial.');
    } finally {
      setUpdatingIrrfOfficial(false);
    }
  };

  const atualizarFgtsDaFonteOficial = async () => {
    setUpdatingFgtsOfficial(true);
    try {
      const res = await axios.get('/api/parametros/oficial/fgts');
      const aliquotaPadrao = res.data?.aliquotaPadrao;
      if (res.data?.fonte) {
        setFonteFGTS(res.data.fonte as FonteOficial);
      }
      const current = geralForm.getFieldsValue();
      const payload = {
        ...current,
        vigenciaGeral: current.vigenciaGeral?.format ? current.vigenciaGeral.format('YYYY-MM-DD') : current.vigenciaGeral,
        aliquotaFgts: aliquotaPadrao,
      };
      await axios.post('/api/parametros/geral', payload);
      message.success('FGTS atualizado da fonte oficial (Gov.br).');
      fetchData();
    } catch {
      message.error('Falha ao atualizar FGTS da fonte oficial.');
    } finally {
      setUpdatingFgtsOfficial(false);
    }
  };

  // --- Currency helpers ---
  const currencyFormatter = (value?: string | number) => {
    if (value === undefined || value === null || value === '') return 'R$ ';
    const [intPart, decPart] = String(value).split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `R$ ${withThousands}.${decPart}` : `R$ ${withThousands}`;
  };
  const currencyParser = (displayValue?: string) => {
    if (!displayValue) return 0;
    const numeric = displayValue.replace(/R\$\s?/g, '').replace(/,/g, '');
    const parsed = parseFloat(numeric);
    return isNaN(parsed) ? 0 : parsed;
  };

  // --- Auto-sync com fonte oficial quando toggles estiverem ativos ---
  const [autoSyncDone, setAutoSyncDone] = useState(false);
  const [userEditedFgts, setUserEditedFgts] = useState(false);
  useEffect(() => {
    // Após carregar os dados gerais, se auto* estiver ativo, sincroniza uma vez
    if (!autoSyncDone && !loadingGeral) {
      const current = geralForm.getFieldsValue();
      const tasks: Promise<any>[] = [];
      if (current?.autoINSS) tasks.push(atualizarInssDaFonteOficial());
      if (current?.autoIRRF) tasks.push(atualizarIrrfDaFonteOficial());
      if (current?.autoFGTS && !userEditedFgts) tasks.push(atualizarFgtsDaFonteOficial());
      if (tasks.length) {
        Promise.allSettled(tasks).finally(() => setAutoSyncDone(true));
      } else {
        setAutoSyncDone(true);
      }
    }
  }, [autoSyncDone, loadingGeral, geralForm, userEditedFgts]);

  // --- Columns Defs ---
  const inssColumns: ColumnsType<InssDataType> = [
    { title: 'Salário de (R$)', dataIndex: 'de', key: 'de', render: (val: number) => val.toFixed(2), align: 'right' },
    { title: 'Salário até (R$)', dataIndex: 'ate', key: 'ate', render: (val: number | null) => (val ? val.toFixed(2) : 'Teto'), align: 'right' },
    { title: 'Alíquota (%)', dataIndex: 'aliquota', key: 'aliquota', align: 'right' },
    { title: 'Vigência', dataIndex: 'vigencia', key: 'vigencia', render: (dateStr: string) => dayjs(dateStr).format('DD/MM/YYYY') },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: InssDataType) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showInssModal(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleInssDelete(record.key)} />
        </Space>
      ),
    },
  ];
  const irrfColumns: ColumnsType<IrrfDataType> = [
    { title: 'Base de Cálculo de (R$)', dataIndex: 'de', key: 'de', render: (val: number) => val.toFixed(2), align: 'right' },
    { title: 'Base de Cálculo até (R$)', dataIndex: 'ate', key: 'ate', render: (val: number | null) => (val ? val.toFixed(2) : 'Acima'), align: 'right' },
    { title: 'Alíquota (%)', dataIndex: 'aliquota', key: 'aliquota', align: 'right' },
    { title: 'Parcela a Deduzir (R$)', dataIndex: 'deducao', key: 'deducao', render: (val: number) => val.toFixed(2), align: 'right' },
    { title: 'Vigência', dataIndex: 'vigencia', key: 'vigencia', render: (dateStr: string) => dayjs(dateStr).format('DD/MM/YYYY') },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: IrrfDataType) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showIrrfModal(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleIrrfDelete(record.key)} />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Parâmetros' }]} />
        <Tabs
          defaultActiveKey="inss"
          items={[
            {
              key: 'inss',
              label: 'INSS',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={4}>Parâmetros de Contribuição INSS</Title>
                  <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showInssModal()}>Adicionar Faixa</Button>
                    <Button onClick={atualizarInssDaFonteOficial} loading={updatingInssOfficial}>Atualizar da fonte oficial</Button>
                  </Space>
                  {fonteINSS && (
                    <Typography.Text type="secondary">
                      Fonte oficial: <Typography.Link href={fonteINSS.url} target="_blank" rel="noopener noreferrer">{fonteINSS.nome}</Typography.Link>
                      {' '}· Vigência: {dayjs(fonteINSS.vigencia).isValid() ? dayjs(fonteINSS.vigencia).format('MM/YYYY') : fonteINSS.vigencia}
                    </Typography.Text>
                  )}
                  <Table columns={inssColumns} dataSource={inssData} loading={loadingInss} rowKey="key" pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum parâmetro de INSS encontrado' }} />
                </Space>
              ),
            },
            {
              key: 'irrf',
              label: 'IRRF',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={4}>Parâmetros de Imposto de Renda (IRRF)</Title>
                  <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showIrrfModal()}>Adicionar Faixa</Button>
                    <Button onClick={atualizarIrrfDaFonteOficial} loading={updatingIrrfOfficial}>Atualizar da fonte oficial</Button>
                  </Space>
                  {fonteIRRF && (
                    <Typography.Text type="secondary">
                      Fonte oficial: <Typography.Link href={fonteIRRF.url} target="_blank" rel="noopener noreferrer">{fonteIRRF.nome}</Typography.Link>
                      {' '}· Vigência: {dayjs(fonteIRRF.vigencia).isValid() ? dayjs(fonteIRRF.vigencia).format('MM/YYYY') : fonteIRRF.vigencia}
                    </Typography.Text>
                  )}
                  <Table columns={irrfColumns} dataSource={irrfData} loading={loadingIrrf} rowKey="key" pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum parâmetro de IRRF encontrado' }} />
                </Space>
              ),
            },
            {
              key: 'geral',
              label: 'Geral',
              children: (
                <>
                  <Title level={4}>Parâmetros Gerais</Title>
                  <Form
                    form={geralForm}
                    layout="vertical"
                    onFinish={onGeralFinish}
                    onValuesChange={(changed, all) => {
                      if (Object.prototype.hasOwnProperty.call(changed, 'aliquotaFgts')) {
                        setUserEditedFgts(true);
                      }
                      if (Object.prototype.hasOwnProperty.call(changed, 'autoINSS') && all.autoINSS) {
                        atualizarInssDaFonteOficial();
                      }
                      if (Object.prototype.hasOwnProperty.call(changed, 'autoIRRF') && all.autoIRRF) {
                        atualizarIrrfDaFonteOficial();
                      }
                      if (Object.prototype.hasOwnProperty.call(changed, 'autoFGTS') && all.autoFGTS) {
                        if (!userEditedFgts) {
                          atualizarFgtsDaFonteOficial();
                        }
                      }
                    }}
                    style={{ maxWidth: 400 }}
                  >
                    <Form.Item name="salarioMinimo" label="Salário Mínimo (R$)" rules={[{ required: true, message: 'Campo obrigatório' }]}> 
                      <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} formatter={currencyFormatter} parser={currencyParser} />
                    </Form.Item>
                    <Form.Item name="tetoPrevidenciario" label="Teto Previdenciário (R$)" rules={[{ required: true, message: 'Campo obrigatório' }]}> 
                      <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} formatter={currencyFormatter} parser={currencyParser} />
                    </Form.Item>
                    <Form.Item label="Alíquota FGTS (%)" required>
                      <Space>
                        <Form.Item name="aliquotaFgts" noStyle rules={[{ required: true, message: 'Campo obrigatório' }]}> 
                          <InputNumber min={0} step={0.1} precision={1} style={{ width: 180 }} />
                        </Form.Item>
                        <Button onClick={atualizarFgtsDaFonteOficial} loading={updatingFgtsOfficial}>Carregar da fonte oficial</Button>
                      </Space>
                    </Form.Item>
                    {fonteFGTS && (
                      <Typography.Text type="secondary">
                        Fonte oficial: <Typography.Link href={fonteFGTS.url} target="_blank" rel="noopener noreferrer">{fonteFGTS.nome}</Typography.Link>
                        {' '}· Vigência: {dayjs(fonteFGTS.vigencia).isValid() ? dayjs(fonteFGTS.vigencia).format('MM/YYYY') : fonteFGTS.vigencia}
                      </Typography.Text>
                    )}
                    <Form.Item name="vigenciaGeral" label="Vigência" rules={[{ required: true, message: 'Campo obrigatório' }]}><DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" /></Form.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Form.Item name="autoINSS" label="Atualização automática INSS" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch />
                        </Form.Item>
                        <Form.Item name="autoIRRF" label="Atualização automática IRRF" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch />
                        </Form.Item>
                        <Form.Item name="autoFGTS" label="Atualização automática FGTS" valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch />
                        </Form.Item>
                      </Space>
                      <Typography.Text type="secondary">Fontes oficiais: INSS e FGTS em Gov.br; IRPF na Receita Federal.</Typography.Text>
                    </Space>
                    <Form.Item><Button type="primary" htmlType="submit" loading={loadingGeral}>Salvar Parâmetros Gerais</Button></Form.Item>
                  </Form>
                </>
              ),
            },
          ]}
        />
      </Space>

      <Modal title={editingInssRecord ? 'Editar Faixa de INSS' : 'Adicionar Nova Faixa de INSS'} open={isModalInssVisible} onCancel={handleInssCancel} footer={null} destroyOnHidden>
        <Form form={inssForm} layout="vertical" onFinish={onInssFinish}>
          <Form.Item name="de" label="Salário de (R$)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ate" label="Salário até (R$)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Deixe em branco para o teto" />
          </Form.Item>
          <Form.Item name="aliquota" label="Alíquota (%)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vigencia" label="Vigência" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={handleInssCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit">Salvar</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingIrrfRecord ? 'Editar Faixa de IRRF' : 'Adicionar Nova Faixa de IRRF'} open={isModalIrrfVisible} onCancel={handleIrrfCancel} footer={null} destroyOnHidden>
        <Form form={irrfForm} layout="vertical" onFinish={onIrrfFinish}>
          <Form.Item name="de" label="Base de Cálculo de (R$)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ate" label="Base de Cálculo até (R$)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Deixe em branco para o teto" />
          </Form.Item>
          <Form.Item name="aliquota" label="Alíquota (%)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deducao" label="Parcela a Deduzir (R$)" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vigencia" label="Vigência" rules={[{ required: true, message: 'Campo obrigatório' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Salvar</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default ParametrosPage;