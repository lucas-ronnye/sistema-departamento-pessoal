import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Typography, Space, Card, message, Modal, Breadcrumb, Form, Input, Select, Tag, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

type Filial = { id: number; nome: string; cnpj?: string };

type LocalTrabalho = {
  id: number;
  nome: string;
  tipo: 'Onsite' | 'Remoto' | 'Híbrido';
  filialId?: number;
  cidade?: string;
  estado?: string;
  endereco?: string;
  status: 'Ativo' | 'Inativo';
}

function LocaisTrabalhoPage() {
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [cnpjFilter, setCnpjFilter] = useState<'todos' | 'comCnpj' | 'semCnpj'>('todos');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LocalTrabalho | null>(null);
  const [form] = Form.useForm<LocalTrabalho>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, filRes] = await Promise.all([
        axios.get<LocalTrabalho[]>('/api/locais-trabalho'),
        axios.get<Filial[]>('/api/filiais'),
      ]);
      setLocais(locRes.data);
      setFiliais(filRes.data);
    } catch (e) {
      message.error('Falha ao carregar locais de trabalho.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ tipo: 'Onsite', status: 'Ativo' } as any);
    setIsModalOpen(true);
  };

  const openEdit = (l: LocalTrabalho) => {
    setEditing(l);
    form.setFieldsValue(l);
    setIsModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await axios.put(`/api/locais-trabalho/${editing.id}`, values);
        message.success('Local atualizado com sucesso.');
      } else {
        await axios.post('/api/locais-trabalho', values);
        message.success('Local criado com sucesso.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('Não foi possível salvar o local.');
    }
  };

  const onDelete = (id: number) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/locais-trabalho/${id}`);
          message.success('Local excluído.');
          fetchData();
        } catch {
          message.error('Falha ao excluir local.');
        }
      },
    });
  };

  const hasCnpj = (l: LocalTrabalho) => {
    const filial = l.filialId ? filiais.find(f => f.id === l.filialId) : undefined;
    return Boolean(filial?.cnpj);
  };

  const displayLocais = locais.filter((l) => {
    const possui = hasCnpj(l);
    if (cnpjFilter === 'comCnpj') return possui;
    if (cnpjFilter === 'semCnpj') return !possui;
    return true;
  });

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: (t: LocalTrabalho['tipo']) => <Tag color={t === 'Remoto' ? 'blue' : t === 'Híbrido' ? 'gold' : 'geekblue'}>{t}</Tag> },
    { title: 'Filial', key: 'filialId', render: (_: any, r: LocalTrabalho) => r.filialId ? filiais.find(f => f.id === r.filialId)?.nome || '-' : '-' },
    { title: 'CNPJ', key: 'cnpj', render: (_: any, r: LocalTrabalho) => {
      const filial = r.filialId ? filiais.find(f => f.id === r.filialId) : undefined;
      const cnpj = filial?.cnpj;
      return cnpj ? <Tag color="purple">{cnpj}</Tag> : <Tag>Sem CNPJ</Tag>;
    } },
    { title: 'Cidade/UF', key: 'cidade', render: (_: any, r: LocalTrabalho) => r.cidade && r.estado ? `${r.cidade}/${r.estado}` : '-' },
    { title: 'Endereço', dataIndex: 'endereco', key: 'endereco' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: LocalTrabalho['status']) => <Tag color={s === 'Ativo' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: LocalTrabalho) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>Editar</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(record.id)}>Excluir</Button>
        </Space>
      ),
    },
  ];

  const tipo = Form.useWatch('tipo', form);

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Organização' }, { title: 'Locais de Trabalho' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Locais de Trabalho</Title>
          <Space>
            <Radio.Group
              value={cnpjFilter}
              onChange={(e) => setCnpjFilter(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="todos">Todos</Radio.Button>
              <Radio.Button value="comCnpj">Com CNPJ</Radio.Button>
              <Radio.Button value="semCnpj">Sem CNPJ</Radio.Button>
            </Radio.Group>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Adicionar Local</Button>
          </Space>
        </div>
        <Table rowKey="id" columns={columns} dataSource={displayLocais} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum local cadastrado' }} />
      </Space>

      <Modal open={isModalOpen} title={editing ? 'Editar Local' : 'Novo Local'} onCancel={() => setIsModalOpen(false)} onOk={onSubmit} okText={editing ? 'Salvar' : 'Criar'}>
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome do local' }]}>
            <Input placeholder="Ex.: Escritório Paulista" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="tipo" label="Tipo" style={{ flex: 1 }} rules={[{ required: true, message: 'Informe o tipo' }]}>
              <Select options={[{ label: 'Onsite', value: 'Onsite' }, { label: 'Remoto', value: 'Remoto' }, { label: 'Híbrido', value: 'Híbrido' }]} />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ width: 180 }} initialValue={'Ativo'}>
              <Select options={[{ label: 'Ativo', value: 'Ativo' }, { label: 'Inativo', value: 'Inativo' }]} />
            </Form.Item>
          </Space>
          <Form.Item name="filialId" label="Filial" rules={[{ required: tipo !== 'Remoto', message: 'Selecione a filial (exceto remoto)' }]}>
            <Select allowClear placeholder="Selecione a Filial" options={filiais.map(f => ({ label: f.nome, value: f.id }))} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="cidade" label="Cidade" style={{ flex: 1 }} rules={[{ required: tipo !== 'Remoto', message: 'Informe a cidade para Onsite/Híbrido' }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="estado" label="UF" style={{ width: 120 }} rules={[{ required: tipo !== 'Remoto', message: 'Informe a UF para Onsite/Híbrido' }]}> 
              <Select options={['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => ({ label: uf, value: uf }))} />
            </Form.Item>
          </Space>
          <Form.Item name="endereco" label="Endereço">
            <Input placeholder="Rua/Av, número" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default LocaisTrabalhoPage;