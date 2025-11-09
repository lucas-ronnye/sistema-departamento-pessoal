import { useEffect, useState, useCallback } from 'react';
import {
  Form,
  Input,
  Tabs,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Button,
  message,
  Card,
  Typography,
  Breadcrumb,
  Spin,
  Table,
  Modal,
} from 'antd';
import { SaveOutlined, RollbackOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../../core/AuthContext';

const { Title } = Typography;

// --- Interfaces ---
type ColaboradorPayload = {
  nome: string;
  cpf: string;
  endereco?: string;
  salario?: number;
  cargo?: string;
  dataAdmissao?: any;
  escalaKey?: number;
  cargaHorariaDia?: number;
  localTrabalhoId?: number;
};
type EscalaOption = { key: number; descricao: string; tipo: 'dias' | 'horas' }
interface Dependente {
  id: number;
  colaboradorId: number;
  nome: string;
  parentesco: string;
  dataNascimento: string;
}

function FormColaborador() {
  const [form] = Form.useForm<ColaboradorPayload>();
  const [dependenteForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [escalas, setEscalas] = useState<EscalaOption[]>([]);
  const [loadingEscalas, setLoadingEscalas] = useState(false);
  const { user } = useAuth();
  const permissoes: string[] = Array.isArray(user?.permissoes) ? (user!.permissoes as string[]) : [];
  const canDefinirEscala = permissoes.includes('lider_equipe');

  // State for Dependents
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [isDependenteModalVisible, setIsDependenteModalVisible] = useState(false);
  const [editingDependente, setEditingDependente] = useState<Dependente | null>(null);

  // Locais de trabalho
  type LocalTrabalho = { id: number; nome: string; tipo: 'Onsite' | 'Remoto' | 'Híbrido' };
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [loadingLocais, setLoadingLocais] = useState(false);

  const currencyFormatter = (value?: string | number) => {
    if (value === undefined || value === null || value === '') return 'R$ ';
    const [intPart, decPart] = String(value).split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `R$ ${withThousands}.${decPart}` : `R$ ${withThousands}`;
  };
  const currencyParser = (displayValue?: string) => {
    if (!displayValue) return 0;
    const numeric = displayValue.toString().replace(/R\$\s?/g, '').replace(/,/g, '');
    const parsed = parseFloat(numeric);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchColaboradorData = useCallback(async (colaboradorId: string) => {
    setLoading(true);
    try {
      const [colaboradorRes, dependentesRes] = await Promise.all([
        axios.get(`/api/colaboradores/${colaboradorId}`),
        axios.get(`/api/colaboradores/${colaboradorId}/dependentes`),
      ]);
      
      const colaborador = colaboradorRes.data;
      form.setFieldsValue({
        ...colaborador,
        dataAdmissao: colaborador.dataAdmissao ? dayjs(colaborador.dataAdmissao) : null,
      });
      setDependentes(dependentesRes.data);

    } catch (error) {
      message.error('Falha ao carregar dados do colaborador.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (isEditing) {
      fetchColaboradorData(id);
    } else {
      form.resetFields();
    }
  }, [id, isEditing, fetchColaboradorData]);

  // Load escalas options
  useEffect(() => {
    const loadEscalas = async () => {
      setLoadingEscalas(true);
      try {
        const resp = await axios.get('/api/ponto/escalas');
        setEscalas(resp.data || []);
      } catch {
        message.error('Falha ao carregar escalas disponíveis.');
      } finally {
        setLoadingEscalas(false);
      }
    };
    loadEscalas();
  }, []);

  // Load locais de trabalho
  useEffect(() => {
    const loadLocais = async () => {
      setLoadingLocais(true);
      try {
        const resp = await axios.get('/api/locais-trabalho');
        setLocais(resp.data || []);
      } catch {
        message.error('Falha ao carregar locais de trabalho.');
      } finally {
        setLoadingLocais(false);
      }
    };
    loadLocais();
  }, []);

  // --- Main Form Handler ---
  const onFinish = async (values: ColaboradorPayload) => {
    setSubmitting(true);
    const payload = { ...values, dataAdmissao: values.dataAdmissao?.format('YYYY-MM-DD') };
    try {
      if (isEditing) {
        await axios.put(`/api/colaboradores/${id}`, payload);
        message.success('Colaborador atualizado com sucesso!');
        navigate('/app/colaboradores');
      } else {
        const response = await axios.post('/api/colaboradores', payload);
        const newId = response.data.id;
        message.success('Colaborador criado com sucesso! Adicione os dependentes agora.');
        navigate(`/app/colaboradores/editar/${newId}`);
      }
    } catch (error) {
      const msg = (error as any)?.response?.data?.message || 'Falha ao salvar colaborador.';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Dependents Handlers ---
  const showDependenteModal = (record?: Dependente) => {
    setEditingDependente(record || null);
    dependenteForm.setFieldsValue(record ? { ...record, dataNascimento: dayjs(record.dataNascimento) } : { nome: '', parentesco: '', dataNascimento: null });
    setIsDependenteModalVisible(true);
  };
  const handleDependenteCancel = () => setIsDependenteModalVisible(false);
  
  const onDependenteFinish = async (values: any) => {
    const payload = { ...values, dataNascimento: values.dataNascimento.format('YYYY-MM-DD') };
    try {
      if (editingDependente) {
        await axios.put(`/api/dependentes/${editingDependente.id}`, payload);
        message.success('Dependente atualizado com sucesso!');
      } else {
        await axios.post(`/api/colaboradores/${id}/dependentes`, payload);
        message.success('Dependente adicionado com sucesso!');
      }
      setIsDependenteModalVisible(false);
      fetchColaboradorData(id!);
    } catch {
      message.error('Falha ao salvar dependente.');
    }
  };

  const handleDependenteDelete = (dependenteId: number) => {
    Modal.confirm({
      title: 'Excluir dependente?',
      icon: <ExclamationCircleFilled />,
      content: 'Você tem certeza que deseja excluir este dependente?',
      okText: 'Sim, Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/dependentes/${dependenteId}`);
          message.success('Dependente removido com sucesso!');
          fetchColaboradorData(id!);
        } catch {
          message.error('Falha ao remover dependente.');
        }
      },
    });
  };

  const dependentesColumns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Parentesco', dataIndex: 'parentesco', key: 'parentesco' },
    { title: 'Data de Nascimento', dataIndex: 'dataNascimento', key: 'dataNascimento', render: (val: string) => dayjs(val).format('DD/MM/YYYY') },
    {
      title: 'Ações', key: 'acoes', render: (_: any, record: Dependente) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => showDependenteModal(record)}>Editar</Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDependenteDelete(record.id)}>Excluir</Button>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Breadcrumb items={[{ title: <a onClick={() => navigate('/app/colaboradores')}>Colaboradores</a> }, { title: isEditing ? 'Editar Colaborador' : 'Novo Colaborador' }]} />
          <Title level={3}>{isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}</Title>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Tabs
              defaultActiveKey="dadosPessoais"
              items={[
                {
                  key: 'dadosPessoais',
                  label: 'Dados Pessoais',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}><Input placeholder="Nome completo" /></Form.Item>
                      <Form.Item name="cpf" label="CPF" rules={[{ required: true, message: 'Informe o CPF' }]}><Input placeholder="000.000.000-00" /></Form.Item>
                      <Form.Item name="endereco" label="Endereço"><Input placeholder="Rua, número, bairro, cidade" /></Form.Item>
                    </Space>
                  ),
                },
                {
                  key: 'dadosContratuais',
                  label: 'Dados Contratuais',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item name="salario" label="Salário" rules={[{ required: true, message: 'Informe o salário' }]}> 
                        <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} formatter={currencyFormatter} parser={currencyParser} />
                      </Form.Item>
                      <Form.Item name="cargo" label="Cargo" rules={[{ required: true }]}><Select options={[{ label: 'Assistente', value: 'Assistente' }, { label: 'Analista', value: 'Analista' }, { label: 'Gerente', value: 'Gerente' }]} /></Form.Item>
                      <Form.Item name="dataAdmissao" label="Data de Admissão" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.Item name="localTrabalhoId" label="Local de Trabalho" rules={[{ required: true, message: 'Selecione o local de trabalho' }]}
                        tooltip="Vincula o colaborador a um local (Onsite/Remoto/Híbrido)">
                        <Select
                          loading={loadingLocais}
                          placeholder="Selecione o local"
                          options={locais.map(l => ({ label: l.nome, value: l.id }))}
                        />
                      </Form.Item>
                      {/* Exibe a modalidade conforme o local selecionado */}
                      {(() => {
                        const selectedId = Form.useWatch('localTrabalhoId', form);
                        const selected = locais.find(l => l.id === selectedId);
                        return selected ? (
                          <div>
                            Modalidade de trabalho: <span style={{ fontWeight: 600 }}>{selected.tipo}</span>
                          </div>
                        ) : null;
                      })()}
                      <Form.Item 
                        name="escalaKey" 
                        label="Escala" 
                        rules={canDefinirEscala ? [{ required: true, message: 'Selecione a escala' }] : []}
                        tooltip={canDefinirEscala ? undefined : 'Somente o líder de equipe pode alterar a escala'}
                        extra={canDefinirEscala ? undefined : 'Escala exibida apenas para consulta. Solicite ao líder a definição/alteração.'}
                      > 
                        <Select
                          loading={loadingEscalas}
                          placeholder={canDefinirEscala ? 'Selecione a escala definida pelo gestor' : 'Escala definida pelo líder'}
                          options={escalas.map(e => ({ label: e.descricao, value: Number(e.key) }))}
                          disabled={!canDefinirEscala}
                        />
                      </Form.Item>
                      <Form.Item name="cargaHorariaDia" label="Carga Horária Diária (horas)" tooltip="Horas esperadas por dia de trabalho (ex.: 8, 12)" initialValue={8}>
                        <InputNumber style={{ width: '100%' }} min={0} max={24} step={0.5} />
                      </Form.Item>
                    </Space>
                  ),
                },
                ...(isEditing ? [
                  {
                    key: 'dependentes',
                    label: 'Dependentes',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button icon={<PlusOutlined />} onClick={() => showDependenteModal()}>Adicionar Dependente</Button>
                        <Table columns={dependentesColumns} dataSource={dependentes} rowKey="id" pagination={false} size="small" scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum dependente cadastrado.' }} />
                      </Space>
                    ),
                  }
                ] : [])
              ]}
            />

            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 24 }}>
              <Button icon={<RollbackOutlined />} onClick={() => navigate('/app/colaboradores')} disabled={submitting}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>Salvar</Button>
            </Space>
          </Form>
        </Space>
      </Spin>

      <Modal title={editingDependente ? 'Editar Dependente' : 'Novo Dependente'} open={isDependenteModalVisible} onCancel={handleDependenteCancel} footer={null} destroyOnHidden>
        <Form form={dependenteForm} layout="vertical" onFinish={onDependenteFinish}>
          <Form.Item name="nome" label="Nome Completo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="parentesco" label="Parentesco" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="dataNascimento" label="Data de Nascimento" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">Salvar Dependente</Button></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default FormColaborador;