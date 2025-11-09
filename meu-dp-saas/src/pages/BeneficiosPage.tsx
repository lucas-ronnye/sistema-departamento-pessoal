import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Card,
  Tag,
  Breadcrumb,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

// --- Interfaces ---
interface Beneficio {
  key: React.Key;
  colaboradorId: number;
  colaboradorNome: string;
  tipo: 'VT' | 'VR' | 'VA' | 'Plano de Saúde';
  valor: number;
  status: 'ativo' | 'inativo';
}

interface ColaboradorOption {
  id: number;
  nome: string;
}

function BeneficiosPage() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Beneficio | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [beneficiosRes, colaboradoresRes] = await Promise.all([
        axios.get('/api/beneficios'),
        axios.get('/api/colaboradores'),
      ]);
      setBeneficios(beneficiosRes.data);
      setColaboradores(colaboradoresRes.data);
    } catch (error) {
      message.error('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showModal = (record?: Beneficio) => {
    setEditingRecord(record || null);
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir este benefício?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/beneficios/${key}`);
          message.success('Benefício removido com sucesso!');
          fetchData();
        } catch (error) {
          message.error('Falha ao remover benefício.');
        }
      },
    });
  };

  const onFinish = async (values: any) => {
    try {
      if (editingRecord) {
        await axios.put(`/api/beneficios/${editingRecord.key}`, values);
        message.success('Benefício atualizado com sucesso!');
      } else {
        await axios.post('/api/beneficios', values);
        message.success('Benefício adicionado com sucesso!');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Falha ao salvar benefício.');
    }
  };

  const columns: ColumnsType<Beneficio> = [
    { title: 'Colaborador', dataIndex: 'colaboradorNome', key: 'colaboradorNome' },
    { title: 'Tipo de Benefício', dataIndex: 'tipo', key: 'tipo' },
    { title: 'Valor (R$)', dataIndex: 'valor', key: 'valor', render: (val: number) => val.toFixed(2), align: 'right' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'ativo' ? 'green' : 'red'}>{status.toUpperCase()}</Tag> },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Beneficio) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Editar</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.key)}>Excluir</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Benefícios' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Gestão de Benefícios</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Adicionar Benefício
          </Button>
        </div>

        <Table rowKey="key" columns={columns} dataSource={beneficios} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum benefício encontrado' }} />

        <Modal
          open={isModalVisible}
          title={editingRecord ? 'Editar Benefício' : 'Novo Benefício'}
          onCancel={handleCancel}
          footer={null}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open) {
              form.setFieldsValue(editingRecord || { status: 'ativo' });
            }
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: 'ativo' }}>
            <Form.Item name="colaboradorId" label="Colaborador" rules={[{ required: true, message: 'Selecione o colaborador' }]}>
              <Select options={colaboradores.map(c => ({ label: c.nome, value: c.id }))} />
            </Form.Item>
            <Form.Item name="tipo" label="Tipo de Benefício" rules={[{ required: true, message: 'Selecione o tipo' }]}>
              <Select options={[
                { label: 'Vale Transporte (VT)', value: 'VT' },
                { label: 'Vale Refeição (VR)', value: 'VR' },
                { label: 'Vale Alimentação (VA)', value: 'VA' },
                { label: 'Plano de Saúde', value: 'Plano de Saúde' },
              ]} />
            </Form.Item>
            <Form.Item name="valor" label="Valor (R$)" rules={[{ required: true, message: 'Informe o valor' }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Selecione o status' }]}>
              <Select options={[{ label: 'Ativo', value: 'ativo' }, { label: 'Inativo', value: 'inativo' }]} />
            </Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit">Salvar</Button>
            </Space>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
}

export default BeneficiosPage;


