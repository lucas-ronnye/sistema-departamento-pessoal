import { useState } from 'react';
import { Button, DatePicker, Space, Typography, message, Table, Card, Select, Tag, Breadcrumb } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import axios from 'axios';

const { Title } = Typography;

interface FolhaCalculada {
  key: React.Key;
  colaborador: string;
  salarioBruto: number;
  descontos: number;
  salarioLiquido: number;
  baseFgts: number;
  fgtsMes: number;
  status: 'calculado' | 'erro';
}

function ProcessarFolhaPage() {
  const [loading, setLoading] = useState(false);
  const [competencia, setCompetencia] = useState<Dayjs | null>(null);
  const [tipoFolha, setTipoFolha] = useState<string>('mensal');
  const [resultado, setResultado] = useState<FolhaCalculada[]>([]);

  const handleProcessar = async () => {
    if (!competencia) {
      message.warning('Por favor, selecione a competência.');
      return;
    }
    setLoading(true);
    setResultado([]);
    
    try {
      const response = await axios.post('/api/folha/calcular', {
        competencia: competencia.format('YYYY-MM'),
        tipo: tipoFolha,
      });
      setResultado(response.data.resultados);
      message.success(`Folha de ${competencia.format('MM/YYYY')} processada com sucesso!`);
    } catch (error) {
      message.error(`Falha ao processar a folha de ${competencia.format('MM/YYYY')}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setResultado([]);
    setCompetencia(null);
  };

  const columns: ColumnsType<FolhaCalculada> = [
    { title: 'Colaborador', dataIndex: 'colaborador', key: 'colaborador' },
    { title: 'Salário Bruto', dataIndex: 'salarioBruto', key: 'salarioBruto', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
    { title: 'Base FGTS', dataIndex: 'baseFgts', key: 'baseFgts', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
    { title: 'FGTS do Mês', dataIndex: 'fgtsMes', key: 'fgtsMes', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
    { title: 'Total Descontos', dataIndex: 'descontos', key: 'descontos', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
    { title: 'Salário Líquido', dataIndex: 'salarioLiquido', key: 'salarioLiquido', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'calculado' ? 'green' : 'red'}>{status.toUpperCase()}</Tag> },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Folha de Pagamento' }, { title: 'Processar Folha' }]} />
      <Title level={3} style={{ margin: 0 }}>
        Processamento da Folha de Pagamento
      </Title>

      <Card title="Filtros para Processamento">
        <Space>
          <DatePicker
            picker="month"
            placeholder="Competência"
            value={competencia}
            onChange={setCompetencia}
            style={{ width: '100%' }}
          />
          <Select
            value={tipoFolha}
            onChange={setTipoFolha}
            style={{ width: 200 }}
            options={[
              { value: 'mensal', label: 'Folha Mensal' },
              { value: 'adiantamento', label: 'Adiantamento' },
              { value: '13_primeira', label: '13º Primeira Parcela' },
              { value: '13_segunda', label: '13º Segunda Parcela' },
            ]}
          />
          <Button type="primary" onClick={handleProcessar} loading={loading} disabled={!competencia}>
            Processar Folha
          </Button>
          {resultado.length > 0 && <Button onClick={handleLimpar}>Limpar Resultados</Button>}
        </Space>
      </Card>

      {resultado.length > 0 && (
        <Card title={`Resultados da Competência ${competencia?.format('MM/YYYY')}`}>
          <Table<FolhaCalculada>
            dataSource={resultado}
            columns={columns}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Nenhum resultado para exibir' }}
          />
        </Card>
      )}
    </Space>
  );
}

export default ProcessarFolhaPage;