import React from 'react';
import { Card, Col, Descriptions, Row, Space, Table, Typography } from 'antd';
import { useThemeMode } from '../../core/ThemeContext';

const { Title, Text } = Typography;

// --- Interfaces ---
interface LinhaHolerite {
  key: React.Key;
  descricao: string;
  referencia?: string | number;
  provento?: number;
  desconto?: number;
}

export interface HoleriteData {
  empresaNome: string;
  empresaCnpj: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  cargo: string;
  competencia: string;
  proventos: LinhaHolerite[];
  descontos: LinhaHolerite[];
  totalProventos: number;
  totalDescontos: number;
  salarioLiquido: number;
  salarioBase: number;
  baseInss: number;
  baseFgts: number;
  fgtsMes: number;
  baseIrrf: number;
}

interface ContrachequeProps {
  data: HoleriteData;
}

const columns = [
  { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
  { title: 'Ref.', dataIndex: 'referencia', key: 'referencia', align: 'center' as const },
  { title: 'Proventos (R$)', dataIndex: 'provento', key: 'provento', align: 'right' as const, render: (val?: number) => val?.toFixed(2) },
  { title: 'Descontos (R$)', dataIndex: 'desconto', key: 'desconto', align: 'right' as const, render: (val?: number) => val?.toFixed(2) },
];

export function Contracheque({ data }: ContrachequeProps) {
  const { mode } = useThemeMode();

  const isDarkMode = mode === 'dark';
  const backgroundColor = isDarkMode ? '#333333' : '#fafafa';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#434343' : '#f0f0f0'; // Cor da borda dinâmica

  return (
    <Card style={{ backgroundColor: isDarkMode ? '#141414' : '#fff' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, color: textColor }}>Recibo de Pagamento de Salário</Title>
        
        <Descriptions bordered size="small" column={2} labelStyle={{ color: textColor }} contentStyle={{ color: textColor }}>
          <Descriptions.Item label="Empresa">{data.empresaNome}</Descriptions.Item>
          <Descriptions.Item label="CNPJ">{data.empresaCnpj}</Descriptions.Item>
          <Descriptions.Item label="Colaborador(a)">{data.colaboradorNome}</Descriptions.Item>
          <Descriptions.Item label="CPF">{data.colaboradorCpf}</Descriptions.Item>
          <Descriptions.Item label="Cargo">{data.cargo}</Descriptions.Item>
          <Descriptions.Item label="Competência">{data.competencia}</Descriptions.Item>
        </Descriptions>

        <Table
          columns={columns}
          dataSource={[
            ...data.proventos.map(item => ({ ...item, key: `provento-${item.key}` })),
            ...data.descontos.map(item => ({ ...item, key: `desconto-${item.key}` })),
          ]}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 'max-content' }}
          style={{ borderColor: borderColor }} // Aplicar cor da borda na tabela
          summary={() => (
            <Table.Summary.Row style={{ background: backgroundColor, textAlign: 'right' }}>
              <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ color: textColor }}>TOTAIS</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={2}><Text strong style={{ color: textColor }}>{data.totalProventos.toFixed(2)}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={3}><Text strong style={{ color: textColor }}>{data.totalDescontos.toFixed(2)}</Text></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        <Row justify="space-between" style={{ background: backgroundColor, padding: '8px 16px', border: `1px solid ${borderColor}` }}>
          <Col>
            <Title level={5} style={{ color: textColor }}>Salário Líquido</Title>
          </Col>
          <Col>
            <Title level={5} style={{ color: textColor }}>R$ {data.salarioLiquido.toFixed(2)}</Title>
          </Col>
        </Row>

        <Descriptions bordered size="small" column={4} style={{ marginTop: 16 }} labelStyle={{ color: textColor }} contentStyle={{ color: textColor }}>
            <Descriptions.Item label="Salário Base">R$ {data.salarioBase.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Base INSS">R$ {data.baseInss.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Base FGTS">R$ {data.baseFgts.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="FGTS do Mês">R$ {data.fgtsMes.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Base IRRF">R$ {data.baseIrrf.toFixed(2)}</Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}
