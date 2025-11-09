import { useState, useEffect } from 'react';
import { Card, Col, Row, Space, Typography, Button, DatePicker, Select, message, notification, Breadcrumb } from 'antd';
import { FilePdfOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Link } = Typography;

// --- Tipos e Mock Data ---
type FilterType = 'ano' | 'mes' | 'colaborador';
interface Relatorio {
  key: string;
  titulo: string;
  descricao: string;
  filtros?: FilterType[];
}
interface ColaboradorOption {
  id: number;
  nome: string;
}

const relatorios: Relatorio[] = [
  { key: 'informe-rendimentos', titulo: 'Informe de Rendimentos', descricao: 'Gere o informe de rendimentos (IRPF) para um colaborador em um ano específico.', filtros: ['ano', 'colaborador'] },
  { key: 'conferencia-folha', titulo: 'Conferência da Folha', descricao: 'Relatório consolidado para conferência dos valores da folha de pagamento.', filtros: ['mes'] },
  { key: 'custo-centro', titulo: 'Custo por Centro de Custo', descricao: 'Distribuição de custos da folha por centros de custo.', filtros: ['mes'] },
  { key: 'absenteismo', titulo: 'Absenteísmo', descricao: 'Indicadores de faltas e afastamentos por período.', filtros: ['mes'] },
];

function RelatoriosPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  useEffect(() => {
    axios.get('/api/colaboradores')
      .then(res => setColaboradores(res.data))
      .catch(() => message.error('Falha ao carregar lista de colaboradores.'))
      .finally(() => setLoadingColaboradores(false));
  }, []);

  const handleFilterChange = (reportKey: string, filterKey: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [reportKey]: {
        ...prev[reportKey],
        [filterKey]: value,
      },
    }));
  };

  const handleGenerate = async (reportKey: string) => {
    const filters = filterValues[reportKey] || {};
    setGenerating(reportKey);
    try {
      const response = await axios.post(`/api/relatorios/${reportKey}`, filters);
      notification.success({
        message: 'Relatório Gerado!',
        description: (
          <Link href={response.data.fileUrl} target="_blank">
            Clique aqui para baixar seu relatório.
          </Link>
        ),
      });
    } catch (error) {
      message.error(`Falha ao gerar o relatório: ${reportKey}`);
    } finally {
      setGenerating(null);
    }
  };

  const renderFilters = (report: Relatorio) => {
    if (!report.filtros) return null;

    return (
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        {report.filtros.map(filtro => {
          const key = `${report.key}-${filtro}`;
          if (filtro === 'ano') {
            return <DatePicker key={key} picker="year" style={{ width: '100%' }} placeholder="Selecione o Ano" onChange={date => handleFilterChange(report.key, filtro, date?.year())} />;
          }
          if (filtro === 'mes') {
            return <DatePicker key={key} picker="month" style={{ width: '100%' }} placeholder="Selecione o Mês" onChange={date => handleFilterChange(report.key, filtro, date?.format('YYYY-MM'))} />;
          }
          if (filtro === 'colaborador') {
            return <Select key={key} style={{ width: '100%' }} placeholder="Selecione o Colaborador" options={colaboradores.map(c => ({ label: c.nome, value: c.id }))} onChange={value => handleFilterChange(report.key, filtro, value)} loading={loadingColaboradores} />;
          }
          return null;
        })}
      </Space>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Relatórios' }]} />
      <Title level={3} style={{ margin: 0 }}>Central de Relatórios</Title>
      <Row gutter={[16, 16]}>
        {relatorios.map((r) => (
          <Col key={r.key} xs={24} sm={12} md={8}>
            <Card title={r.titulo} bordered>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Paragraph type="secondary" style={{ flexGrow: 1, minHeight: 48 }}>
                  {r.descricao}
                </Paragraph>
                {renderFilters(r)}
                <Button
                  type="primary"
                  icon={generating === r.key ? <LoadingOutlined /> : <FilePdfOutlined />}
                  onClick={() => handleGenerate(r.key)}
                  disabled={generating !== null || r.filtros?.some(f => !filterValues[r.key]?.[f])}
                >
                  {generating === r.key ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export default RelatoriosPage;