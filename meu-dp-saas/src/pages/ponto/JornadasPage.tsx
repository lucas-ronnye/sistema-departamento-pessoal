import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  TimePicker,
  message,
  Card,
  Breadcrumb,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title } = Typography;
const { RangePicker } = TimePicker;

// --- Interface ---
interface Jornada {
  key: React.Key;
  descricao: string;
  entrada: string;
  saida: string;
  intervalo?: [string, string];
}

function JornadasPage() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Jornada | null>(null);
  const [form] = Form.useForm();

  const fetchJornadas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/jornadas');
      setJornadas(response.data);
    } catch (error) {
      message.error('Falha ao carregar jornadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJornadas();
  }, [fetchJornadas]);

  const showModal = (record?: Jornada) => {
    setEditingRecord(record || null);
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir esta jornada?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/jornadas/${key}`);
          message.success('Jornada removida com sucesso!');
          fetchJornadas();
        } catch (error) {
          message.error('Falha ao remover jornada.');
        }
      },
    });
  };

  const onFinish = async (values: any) => {
    const payload = {
      descricao: values.descricao,
      entrada: values.entrada.format('HH:mm'),
      saida: values.saida.format('HH:mm'),
      intervalo: values.intervalo ? [values.intervalo[0].format('HH:mm'), values.intervalo[1].format('HH:mm')] : undefined,
    };

    try {
      if (editingRecord) {
        await axios.put(`/api/jornadas/${editingRecord.key}`, payload);
        message.success('Jornada atualizada com sucesso!');
      } else {
        await axios.post('/api/jornadas', payload);
        message.success('Jornada criada com sucesso!');
      }
      setIsModalVisible(false);
      fetchJornadas();
    } catch (error) {
      message.error('Falha ao salvar jornada.');
    }
  };

  const columns = [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Entrada', dataIndex: 'entrada', key: 'entrada' },
    { title: 'Saída', dataIndex: 'saida', key: 'saida' },
    { title: 'Intervalo', dataIndex: 'intervalo', key: 'intervalo', render: (intervalo?: [string, string]) => intervalo ? `${intervalo[0]} - ${intervalo[1]}` : 'N/A' },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Jornada) => (
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
        <Breadcrumb items={[{ title: 'Ponto' }, { title: 'Jornadas de Trabalho' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Jornadas de Trabalho</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Nova Jornada</Button>
        </div>

        <Table rowKey="key" columns={columns} dataSource={jornadas} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhuma jornada encontrada' }} />

        <Modal
          open={isModalVisible}
          title={editingRecord ? 'Editar Jornada' : 'Nova Jornada'}
          onCancel={handleCancel}
          footer={null}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open) {
              if (editingRecord) {
                form.setFieldsValue({
                  ...editingRecord,
                  entrada: dayjs(editingRecord.entrada, 'HH:mm'),
                  saida: dayjs(editingRecord.saida, 'HH:mm'),
                  intervalo: editingRecord.intervalo ? [dayjs(editingRecord.intervalo[0], 'HH:mm'), dayjs(editingRecord.intervalo[1], 'HH:mm')] : null,
                });
              } else {
                form.resetFields();
              }
            }
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="descricao" label="Descrição" rules={[{ required: true, message: 'Informe a descrição' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="entrada" label="Horário de Entrada" rules={[{ required: true, message: 'Informe o horário' }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="saida" label="Horário de Saída" rules={[{ required: true, message: 'Informe o horário' }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="intervalo" label="Intervalo">
              <RangePicker format="HH:mm" style={{ width: '100%' }} />
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

export default JornadasPage;