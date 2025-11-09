import { useEffect, useState, useCallback } from 'react';
import { DatePicker, Table, Typography, Space, Card, Button, Tag, message, Modal, Breadcrumb } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { EyeOutlined } from '@ant-design/icons';
import { Contracheque, type HoleriteData } from '../../components/folha/Contracheque';

const { Title } = Typography;

type Recibo = {
  id: number;
  colaborador: string;
  cargo: string;
  competencia: string;
  liquido: number;
  status: 'Disponível' | 'Bloqueado' | 'Pendente';
};

// Mock de um holerite detalhado para o modal
const mockHoleriteDetalhado: HoleriteData = {
  empresaNome: 'Empresa Alpha Ltda',
  empresaCnpj: '12.345.678/0001-90',
  colaboradorNome: 'Ana Souza',
  colaboradorCpf: '123.456.789-00',
  cargo: 'Analista DP',
  competencia: 'Outubro/2025',
  proventos: [
    { key: 1, descricao: 'Salário', referencia: 30, provento: 4200.00 },
    { key: 2, descricao: 'Horas Extras 50%', referencia: 10, provento: 286.36 },
  ],
  descontos: [
    { key: 1, descricao: 'INSS sobre Salário', referencia: 12.23, desconto: 550.51 },
    { key: 2, descricao: 'IRRF sobre Salário', referencia: 22.5, desconto: 354.80 },
    { key: 3, descricao: 'Vale Transporte', referencia: 6, desconto: 252.00 },
  ],
  totalProventos: 4486.36,
  totalDescontos: 1157.31,
  salarioLiquido: 3329.05,
  salarioBase: 4200.00,
  baseInss: 4486.36,
  baseFgts: 4486.36,
  fgtsMes: 358.91,
  baseIrrf: 3935.85,
};

function RecibosPage() {
  const [competencia, setCompetencia] = useState<Dayjs>(dayjs());
  const [data, setData] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecibo, setSelectedRecibo] = useState<HoleriteData | null>(null);

  const fetchRecibos = useCallback(async (mes: Dayjs) => {
    setLoading(true);
    try {
      const mesString = mes.format('YYYY-MM');
      const res = await axios.get<Recibo[]>(`/api/folha/recibos?mes=${mesString}`);
      setData(res.data);
    } catch (error) {
      message.error('Falha ao carregar os recibos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecibos(competencia);
  }, [competencia, fetchRecibos]);

  const handleVisualizar = (recibo: Recibo) => {
    // Em um app real, buscaríamos os dados detalhados do holerite com base no ID do recibo
    // Aqui, usamos o mock, mas ajustamos o nome e a competência para consistência.
    setSelectedRecibo({
      ...mockHoleriteDetalhado,
      colaboradorNome: recibo.colaborador,
      competencia: recibo.competencia,
    });
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedRecibo(null);
  };

  const columns: ColumnsType<Recibo> = [
    { title: 'Colaborador', dataIndex: 'colaborador', key: 'colaborador', width: 200 },
    { title: 'Cargo', dataIndex: 'cargo', key: 'cargo', width: 150 },
    { title: 'Competência', dataIndex: 'competencia', key: 'competencia', width: 120 },
    {
      title: 'Líquido',
      dataIndex: 'liquido',
      key: 'liquido',
      align: 'right',
      width: 120,
      render: (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val),
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: Recibo['status']) => {
        const color = status === 'Disponível' ? 'green' : status === 'Bloqueado' ? 'red' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 100,
      render: (_, record: Recibo) => (
        <Button icon={<EyeOutlined />} onClick={() => handleVisualizar(record)}>
          Visualizar
        </Button>
      )
    }
  ];

  return (
    <Card className="recibos-card">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Folha de Pagamento' }, { title: 'Recibos' }]} />
        <Title level={3} style={{ margin: 0 }}>Recibos de Pagamento</Title>

        <Space>
          <DatePicker
            picker="month"
            placeholder="Competência"
            value={competencia}
            onChange={(date) => date && setCompetencia(date)}
          />
        </Space>
        <div style={{ overflowX: 'auto' }}>
          <Table<Recibo> 
            className="recibos-table"
            rowKey="id" 
            columns={columns} 
            dataSource={data} 
            loading={loading} 
            pagination={{ pageSize: 10 }} 
            locale={{ emptyText: 'Nenhum recibo encontrado para esta competência' }} 
            scroll={{ x: 1000 }} 
          />
        </div>

        <Modal
          open={isModalVisible}
          onCancel={handleModalClose}
          title="Visualização do Contracheque"
          footer={<Button onClick={handleModalClose}>Fechar</Button>}
          width="80%"
          destroyOnHidden
        >
          {selectedRecibo && <Contracheque data={selectedRecibo} />}
        </Modal>
      </Space>
    </Card>
  );
}

export default RecibosPage;