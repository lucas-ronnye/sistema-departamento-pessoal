import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Card,
  Select,
  Breadcrumb,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

// --- Interface ---
interface Escala {
  key: React.Key;
  descricao: string;
  tipo: 'dias' | 'horas';
}

function EscalasPage() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Escala | null>(null);
  const [form] = Form.useForm();

  const fetchEscalas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ponto/escalas');
      setEscalas(response.data);
    } catch (error) {
      message.error('Falha ao carregar escalas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscalas();
  }, [fetchEscalas]);

  const showModal = (record?: Escala) => {
    setEditingRecord(record || null);
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir esta escala?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/ponto/escalas/${key}`);
          message.success('Escala removida com sucesso!');
          fetchEscalas();
        } catch (error) {
          message.error('Falha ao remover escala.');
        }
      },
    });
  };

  const onFinish = async (values: Omit<Escala, 'key'>) => {
    try {
      if (editingRecord) {
        await axios.put(`/api/ponto/escalas/${editingRecord.key}`, values);
        message.success('Escala atualizada com sucesso!');
      } else {
        await axios.post('/api/ponto/escalas', values);
        message.success('Escala criada com sucesso!');
      }
      setIsModalVisible(false);
      fetchEscalas();
    } catch (error) {
      message.error('Falha ao salvar escala.');
    }
  };

  const columns = [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Escala) => (
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
        <Breadcrumb items={[{ title: 'Ponto' }, { title: 'Definição de Escalas' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Definição de Escalas</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Nova Escala
          </Button>
        </div>

        <Table rowKey="key" columns={columns} dataSource={escalas} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhuma escala encontrada' }} />

        <Modal
          open={isModalVisible}
          title={editingRecord ? 'Editar Escala' : 'Nova Escala'}
          onCancel={handleCancel}
          footer={null}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open) {
              form.setFieldsValue(editingRecord || { descricao: '', tipo: 'dias' });
            }
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="descricao" label="Descrição" rules={[{ required: true, message: 'Informe a descrição' }]}>
              <Input placeholder="Ex: 5x2 - Semana Comercial" />
            </Form.Item>
            <Form.Item name="tipo" label="Tipo de Escala" rules={[{ required: true, message: 'Selecione o tipo' }]}>
              <Select
                options={[
                  { label: 'Baseada em Dias', value: 'dias' },
                  { label: 'Baseada em Horas', value: 'horas' },
                ]}
              />
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

export default EscalasPage;

