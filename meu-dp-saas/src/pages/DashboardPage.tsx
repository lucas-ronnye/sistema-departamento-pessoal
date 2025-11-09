import { useState, useEffect, useCallback } from 'react';
import { Card, Col, Row, Space, Typography, Statistic, Table, Tag, message, Spin, Breadcrumb, Button } from 'antd';
import { UserOutlined, TeamOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DashboardSummary {
  totalColaboradores: number;
  colaboradoresAtivos: number;
  saldoBancoHorasTotal: string;
  eventosRecentes: {
    key: number;
    tipo: string;
    descricao: string;
    data: string;
    status: 'info' | 'success' | 'warning' | 'error';
  }[];
}

type DctfwebStatus = {
  competencia: string;
  status: 'Em Andamento' | 'Confessado' | 'Pago';
  valorDebito: number;
  darfDisponivel: boolean;
  darfLinhaDigitavel: string;
}

type FGTSStatus = {
  competencia: string;
  status: 'Aguardando' | 'Guia Gerada' | 'Pago';
  valorGuia: number;
  guiaDisponivel: boolean;
  linhaDigitavel?: string;
}

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fgts, setFgts] = useState<FGTSStatus | null>(null);
  const [dctfwebState, setDctfwebState] = useState<DctfwebStatus | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const fetchMockSummary = (): DashboardSummary => ({
      totalColaboradores: 150,
      colaboradoresAtivos: 120,
      saldoBancoHorasTotal: '+250h 30m',
      eventosRecentes: [
        { key: 1, tipo: 'Admissão', descricao: 'Novo colaborador: João Silva', data: dayjs().subtract(2, 'day').format('DD/MM/YYYY'), status: 'success' },
        { key: 2, tipo: 'Férias', descricao: 'Férias de Maria Souza (15/11 - 30/11)', data: dayjs().subtract(1, 'day').format('DD/MM/YYYY'), status: 'info' },
        { key: 3, tipo: 'Desligamento', descricao: 'Desligamento de Pedro Santos', data: dayjs().format('DD/MM/YYYY'), status: 'error' },
        { key: 4, tipo: 'Ponto', descricao: 'Ajuste de ponto: Ana Costa', data: dayjs().format('DD/MM/YYYY'), status: 'warning' },
      ],
    });

    try {
      const response = await axios.get<DashboardSummary>('/api/dashboard/summary');
      if (response.data && Object.keys(response.data).length > 0) {
        setSummary(response.data);
      } else {
        setSummary(fetchMockSummary());
        message.warning('Dados do dashboard carregados com mocks. A API pode não estar disponível ou retornou vazio.');
      }
    } catch (error) {
      setSummary(fetchMockSummary());
      message.error('Falha ao carregar dados do Dashboard da API. Usando dados de mock.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    (async () => {
      try {
        const [fgtsRes, dctfRes] = await Promise.all([
          axios.get<FGTSStatus>('/api/impostos/fgts-digital'),
          axios.get<DctfwebStatus>('/api/impostos/dctfweb'),
        ])
        setFgts(fgtsRes.data)
        setDctfwebState(dctfRes.data)
      } catch (e) {
        // Mantém silencioso; dashboard ainda funciona com summary
      }
    })()
  }, [fetchSummary]);

  const eventosColumns = [
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Data', dataIndex: 'data', key: 'data' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DashboardSummary['eventosRecentes'][number]['status']) => (
        <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'blue'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Dashboard' }]} />
        <Title level={3} style={{ margin: 0 }}>Visão Geral do Sistema</Title>

        <Spin spinning={loading}>
          {summary && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Total de Colaboradores"
                      value={summary.totalColaboradores}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Colaboradores Ativos"
                      value={summary.colaboradoresAtivos}
                      prefix={<UserOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Saldo Banco de Horas"
                      value={summary.saldoBancoHorasTotal}
                      prefix={summary?.saldoBancoHorasTotal && summary.saldoBancoHorasTotal.startsWith('+') ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      valueStyle={{ color: summary?.saldoBancoHorasTotal && summary.saldoBancoHorasTotal.startsWith('+') ? '#3f8600' : '#cf1322' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Title level={4} style={{ marginTop: 24 }}>Impostos</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Typography.Text strong>FGTS Digital</Typography.Text>
                        {fgts && <Tag color={fgts.status === 'Pago' ? 'green' : fgts.status === 'Guia Gerada' ? 'blue' : 'default'}>{fgts.status}</Tag>}
                      </Space>
                      <Space>
                        <Typography.Text>Competência:</Typography.Text>
                        <Typography.Text>{fgts ? dayjs(fgts.competencia).isValid() ? dayjs(fgts.competencia).format('MM/YYYY') : fgts.competencia : '—'}</Typography.Text>
                      </Space>
                      <Space>
                        <Typography.Text>Guia disponível:</Typography.Text>
                        <Tag color={fgts?.guiaDisponivel ? 'green' : 'default'}>{fgts?.guiaDisponivel ? 'Sim' : 'Não'}</Tag>
                      </Space>
                      <Space>
                        <Button size="small" onClick={() => window.location.assign('/app/impostos/fgts-digital')}>Abrir FGTS</Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Typography.Text strong>DCTFWeb</Typography.Text>
                        {dctfwebState && <Tag color={dctfwebState.status === 'Pago' ? 'green' : dctfwebState.status === 'Confessado' ? 'blue' : 'default'}>{dctfwebState.status}</Tag>}
                      </Space>
                      <Space>
                        <Typography.Text>Competência:</Typography.Text>
                        <Typography.Text>{dctfwebState ? dayjs(dctfwebState.competencia).isValid() ? dayjs(dctfwebState.competencia).format('MM/YYYY') : dctfwebState.competencia : '—'}</Typography.Text>
                      </Space>
                      <Space>
                        <Typography.Text>DARF disponível:</Typography.Text>
                        <Tag color={dctfwebState?.darfDisponivel ? 'green' : 'default'}>{dctfwebState?.darfDisponivel ? 'Sim' : 'Não'}</Tag>
                      </Space>
                      <Space>
                        <Button size="small" onClick={() => window.location.assign('/app/impostos/dctfweb')}>Abrir DCTFWeb</Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Title level={4} style={{ marginTop: 24 }}>Eventos Recentes</Title>
              <Table
                columns={eventosColumns}
                dataSource={summary.eventosRecentes}
                pagination={{ pageSize: 5 }}
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: 'Nenhum evento recente.' }}
              />
            </>
          )}
        </Spin>
      </Space>
    </Card>
  );
}

export default DashboardPage;
