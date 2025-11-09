import { useEffect, useState, useCallback } from 'react';
import { Space, Typography, Select, DatePicker, Calendar, Modal, Button, Tag, Form, message, Card, Spin, Breadcrumb } from 'antd';
import axios from 'axios';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title } = Typography;

// Tipos correspondentes aos handlers
type Jornada = {
  key: React.Key;
  descricao: string;
  entrada: string;
  saida: string;
  intervalo?: [string, string];
}
type GradeResponse = {
  mes: string;
  dias: Record<string, string | null>;
}

function GradeEscalasPage() {
  const [loading, setLoading] = useState(true);
  const [funcionario, setFuncionario] = useState<string>('Ana Souza');
  const [mes, setMes] = useState<Dayjs>(dayjs());
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [form] = Form.useForm();

  const fetchGrade = useCallback(async (currentMes: Dayjs) => {
    setLoading(true);
    try {
      const mesString = currentMes.format('YYYY-MM');
      const [gradeRes, jornadasRes] = await Promise.all([
        axios.get<GradeResponse>(`/api/ponto/grade?mes=${mesString}`),
        axios.get<Jornada[]>('/api/jornadas'),
      ]);
      setGrade(gradeRes.data);
      setJornadas(jornadasRes.data);
    } catch (error) {
      message.error('Falha ao carregar dados da grade de escalas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrade(mes);
  }, [mes, fetchGrade]);

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      const key = current.format('YYYY-MM-DD');
      const nomeJornada = grade?.dias[key];
      if (nomeJornada) {
        return <Tag color={nomeJornada === 'Folga' ? 'gold' : 'blue'}>{nomeJornada}</Tag>;
      }
    }
    return info.originNode;
  };

  const onSelectDate = (value: Dayjs) => {
    setSelectedDate(value);
    setIsModalVisible(true);
  };

  const handleCancel = () => setIsModalVisible(false);

  const onAssign = async (values: { jornadaKey?: React.Key, tipo: 'jornada' | 'folga' }) => {
    if (!selectedDate) return;

    const dateKey = selectedDate.format('YYYY-MM-DD');
    let jornadaNome = 'Folga';

    if (values.tipo === 'jornada') {
      const selectedJornada = jornadas.find((j) => j.key === values.jornadaKey);
      if (!selectedJornada) {
        message.error('Jornada selecionada inválida.');
        return;
      }
      jornadaNome = selectedJornada.descricao;
    }
    
    try {
      await axios.post('/api/ponto/grade', { dateKey, jornadaNome });
      message.success(`'${jornadaNome}' atribuído ao dia ${selectedDate.format('DD/MM/YYYY')}`);
      setIsModalVisible(false);
      fetchGrade(mes); // Recarrega a grade para mostrar a alteração
    } catch (error) {
      message.error('Falha ao atribuir jornada.');
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Ponto' }, { title: 'Grade de Escalas' }]} />
        <Title level={3} style={{ margin: 0 }}>Grade de Escalas</Title>

        <Space>
          <Select value={funcionario} onChange={setFuncionario} style={{ minWidth: 220 }} options={[{ label: 'Ana Souza', value: 'Ana Souza' }]} />
          <DatePicker picker="month" value={mes} onChange={(date) => date && setMes(date)} />
        </Space>

        <Spin spinning={loading}>
          <Calendar fullscreen cellRender={cellRender} onSelect={onSelectDate} value={mes} />
        </Spin>

        <Modal 
          open={isModalVisible} 
          onCancel={handleCancel} 
          title={`Atribuir para ${selectedDate?.format('DD/MM/YYYY')}`} 
          footer={null} 
          destroyOnHidden
          afterOpenChange={(open) => { if (open) form.resetFields(); }}
        >
          <Form form={form} layout="vertical" onFinish={onAssign}>
            <Form.Item name="tipo" label="Tipo de Atribuição" initialValue="jornada">
              <Select options={[{label: 'Jornada de Trabalho', value: 'jornada'}, {label: 'Folga', value: 'folga'}]} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.tipo !== curr.tipo}>
              {({ getFieldValue }) => getFieldValue('tipo') === 'jornada' && (
                <Form.Item name="jornadaKey" label="Jornada" rules={[{ required: true, message: 'Selecione a jornada' }]}>
                  <Select style={{ width: '100%' }} options={jornadas.map((j) => ({ label: j.descricao, value: j.key }))} />
                </Form.Item>
              )}
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

export default GradeEscalasPage;