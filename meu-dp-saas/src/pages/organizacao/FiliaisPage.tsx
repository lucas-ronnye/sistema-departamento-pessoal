import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Typography, Space, Card, message, Modal, Breadcrumb, Form, Input, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

type Filial = {
  id: number;
  nome: string;
  cnpj: string;
  cidade: string;
  estado: string;
  endereco?: string;
  status: 'Ativo' | 'Inativo';
}

function FiliaisPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Filial | null>(null);
  const [form] = Form.useForm<Filial>();

  const fetchFiliais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Filial[]>('/api/filiais');
      setFiliais(res.data);
    } catch (e) {
      message.error('Falha ao carregar filiais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiliais();
  }, [fetchFiliais]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (f: Filial) => {
    setEditing(f);
    form.setFieldsValue(f);
    setIsModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await axios.put(`/api/filiais/${editing.id}`, values);
        message.success('Filial atualizada com sucesso.');
      } else {
        await axios.post('/api/filiais', values);
        message.success('Filial criada com sucesso.');
      }
      setIsModalOpen(false);
      fetchFiliais();
    } catch (e: any) {
      if (e?.errorFields) return; // validation
      message.error('Não foi possível salvar a filial.');
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
          await axios.delete(`/api/filiais/${id}`);
          message.success('Filial excluída.');
          fetchFiliais();
        } catch {
          message.error('Falha ao excluir filial.');
        }
      },
    });
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'Cidade/UF', key: 'cidade', render: (_: any, r: Filial) => `${r.cidade}/${r.estado}` },
    { title: 'Endereço', dataIndex: 'endereco', key: 'endereco' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: Filial['status']) => <Tag color={s === 'Ativo' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Filial) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>Editar</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(record.id)}>Excluir</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Organização' }, { title: 'Filiais' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Cadastro de Filiais</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Adicionar Filial</Button>
        </div>
        <Table rowKey="id" columns={columns} dataSource={filiais} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhuma filial cadastrada' }} />
      </Space>

      <Modal open={isModalOpen} title={editing ? 'Editar Filial' : 'Nova Filial'} onCancel={() => setIsModalOpen(false)} onOk={onSubmit} okText={editing ? 'Salvar' : 'Criar'}>
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input placeholder="Ex.: Matriz" />
          </Form.Item>
          <Form.Item name="cnpj" label="CNPJ" rules={[{ required: true, message: 'Informe o CNPJ' }]}>
            <Input placeholder="00.000.000/0000-00" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="cidade" label="Cidade" style={{ flex: 1 }} rules={[{ required: true, message: 'Informe a cidade' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="estado" label="UF" style={{ width: 120 }} rules={[{ required: true, message: 'Informe a UF' }]}>
              <Select options={['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => ({ label: uf, value: uf }))} />
            </Form.Item>
          </Space>
          <Form.Item name="endereco" label="Endereço">
            <Input placeholder="Rua/Av, número" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue={'Ativo'}>
            <Select options={[{ label: 'Ativo', value: 'Ativo' }, { label: 'Inativo', value: 'Inativo' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default FiliaisPage;