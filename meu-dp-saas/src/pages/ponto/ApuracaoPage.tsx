import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Space,
  Typography,
  Modal,
  Form,
  TimePicker,
  message,
  Card,
  Tag,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Breadcrumb,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import axios from 'axios';

const { Title } = Typography;

// --- Interfaces ---
interface PontoDia {
  key: React.Key;
  colaboradorId: number;
  mes: string;
  dia: string;
  marcacoes: string[];
  horasTrabalhadas: string;
  saldoDia: string;
}
interface ColaboradorOption {
  id: number;
  nome: string;
}

function ApuracaoPage() {
  const [pontos, setPontos] = useState<PontoDia[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PontoDia | null>(null);
  const [form] = Form.useForm();

  const [selectedColaboradorId, setSelectedColaboradorId] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState<Dayjs>(dayjs());

  const fetchApuracao = useCallback(async () => {
    if (!selectedColaboradorId || !selectedMes) {
      setPontos([]);
      return;
    }
    setLoading(true);
    try {
      const mesString = selectedMes.format('YYYY-MM');
      const response = await axios.get(`/api/ponto/apuracao?colaboradorId=${selectedColaboradorId}&mes=${mesString}`);
      setPontos(response.data);
    } catch (error) {
      message.error('Falha ao carregar apuração de ponto.');
    } finally {
      setLoading(false);
    }
  }, [selectedColaboradorId, selectedMes]);

  const fetchColaboradores = useCallback(async () => {
    setLoadingColaboradores(true);
    try {
      const response = await axios.get('/api/colaboradores');
      setColaboradores(response.data);
      if (response.data.length > 0) {
        setSelectedColaboradorId(response.data[0].id); // Seleciona o primeiro por padrão
      }
    } catch (error) {
      message.error('Falha ao carregar lista de colaboradores.');
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  useEffect(() => {
    fetchColaboradores();
  }, [fetchColaboradores]);

  useEffect(() => {
    fetchApuracao();
  }, [fetchApuracao]);

  const showModal = (record: PontoDia) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const onFinish = async (values: any) => {
    const { marcacoes } = values;
    const marcacoesAsString = marcacoes.map((m: Dayjs) => m.format('HH:mm'));
    
    try {
      await axios.post('/api/ponto/ajuste', {
        colaboradorId: selectedColaboradorId,
        mes: selectedMes.format('YYYY-MM'),
        dia: editingRecord?.dia,
        novasMarcacoes: marcacoesAsString,
      });
      message.success(`Marcações do dia ${editingRecord?.dia} ajustadas.`);
      setIsModalVisible(false);
      fetchApuracao(); // Recarrega os dados
    } catch (error) {
      message.error('Falha ao salvar ajustes.');
    }
  };

  const columns = [
    { title: 'Dia', dataIndex: 'dia', key: 'dia' },
    { 
      title: 'Marcações', 
      dataIndex: 'marcacoes', 
      key: 'marcacoes',
      render: (marcacoes: string[]) => marcacoes.map((m, i) => <Tag key={i}>{m}</Tag>)
    },
    { title: 'Horas Trabalhadas', dataIndex: 'horasTrabalhadas', key: 'horasTrabalhadas', align: 'right' as const },
    { title: 'Saldo do Dia', dataIndex: 'saldoDia', key: 'saldoDia', align: 'right' as const },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: PontoDia) => (
        <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Ajustar</Button>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Ponto' }, { title: 'Apuração de Ponto' }]} />
        <Title level={3} style={{ margin: 0 }}>Apuração de Ponto</Title>

        <Card>
          <Space>
            <Select
              style={{ width: 220 }}
              placeholder="Selecione o Colaborador"
              options={colaboradores.map(c => ({label: c.nome, value: c.id}))}
              onChange={setSelectedColaboradorId}
              value={selectedColaboradorId}
              loading={loadingColaboradores}
            />
            <DatePicker
              picker="month"
              defaultValue={dayjs()}
              onChange={(date) => date && setSelectedMes(date)}
              value={selectedMes}
            />
            <Button type="primary" onClick={fetchApuracao} loading={loading}>Buscar</Button>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col span={8}><Statistic title="Horas Contratadas" value="184:00" /></Col>
          <Col span={8}><Statistic title="Horas Trabalhadas" value="186:18" /></Col>
          <Col span={8}><Statistic title="Saldo Banco de Horas" value="+02:18" valueStyle={{ color: '#3f8600' }} /></Col>
        </Row>

        <Table rowKey="key" columns={columns} dataSource={pontos} loading={loading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum registro de ponto para o período.' }} />

        <Modal
          open={isModalVisible}
          title={`Ajustar Marcações - ${editingRecord?.dia}`}
          onCancel={handleCancel}
          footer={null}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open && editingRecord) {
              const marcacoesAsDayjs = editingRecord.marcacoes.map(m => dayjs(m, 'HH:mm'));
              form.setFieldsValue({ marcacoes: marcacoesAsDayjs });
            }
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.List name="marcacoes">
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{width: '100%'}}>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item {...field} rules={[{ required: true, message: 'Horário é obrigatório' }]}>
                        <TimePicker format="HH:mm" />
                      </Form.Item>
                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Adicionar Marcação
                  </Button>
                </Space>
              )}
            </Form.List>
            <br />
            <Form.Item>
              <Button type="primary" htmlType="submit">Salvar Ajustes</Button>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
}

export default ApuracaoPage;
