import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Typography, Space, Card, Tag, message, Modal, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

interface Colaborador {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  unidade: string;
  localTrabalhoId?: number;
  status: 'ativo' | 'inativo';
  cargaHorariaDia?: number;
}

function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [locais, setLocais] = useState<{ id: number; nome: string; tipo: 'Onsite' | 'Remoto' | 'Híbrido' }[]>([]);
  const navigate = useNavigate();

  const fetchColaboradores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/colaboradores');
      setColaboradores(response.data);
    } catch (error) {
      message.error('Falha ao carregar a lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColaboradores();
  }, [fetchColaboradores]);

  useEffect(() => {
    const loadLocais = async () => {
      try {
        const response = await axios.get('/api/locais-trabalho');
        setLocais(response.data);
      } catch {
        // silencioso para não quebrar a listagem
      }
    };
    loadLocais();
  }, []);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Você tem certeza que deseja excluir este colaborador?',
      icon: <ExclamationCircleFilled />,
      content: 'Esta ação não poderá ser desfeita.',
      okText: 'Sim, excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await axios.delete(`/api/colaboradores/${id}`);
          message.success('Colaborador removido com sucesso!');
          fetchColaboradores(); // Recarrega a lista
        } catch (error) {
          message.error('Falha ao remover colaborador.');
        }
      },
    });
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'CPF', dataIndex: 'cpf', key: 'cpf' },
    { title: 'Cargo', dataIndex: 'cargo', key: 'cargo' },
    {
      title: 'Local de Trabalho',
      key: 'localTrabalho',
      render: (_: any, c: Colaborador) => {
        const local = c.localTrabalhoId ? locais.find(l => l.id === c.localTrabalhoId) : undefined;
        return local?.nome || c.unidade || '-';
      }
    },
    {
      title: 'Modalidade',
      key: 'modalidade',
      render: (_: any, c: Colaborador) => {
        const local = c.localTrabalhoId ? locais.find(l => l.id === c.localTrabalhoId) : undefined;
        const tipo = local?.tipo;
        if (!tipo) return '-';
        const color = tipo === 'Remoto' ? 'blue' : tipo === 'Híbrido' ? 'gold' : 'geekblue';
        return <Tag color={color}>{tipo}</Tag>;
      }
    },
    { title: 'Carga/Dia (h)', dataIndex: 'cargaHorariaDia', key: 'cargaHorariaDia', render: (v?: number) => (v ?? 8) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status?: 'ativo' | 'inativo') => {
        if (!status) {
          return <Tag color="grey">INDEFINIDO</Tag>;
        }
        return <Tag color={status === 'ativo' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Colaborador) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/app/colaboradores/editar/${record.id}`)}>
            Editar
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Breadcrumb items={[{ title: 'Colaboradores' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={3} style={{ margin: 0 }}>
            Gestão de Colaboradores
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/app/colaboradores/novo')}
          >
            Adicionar Colaborador
          </Button>
        </div>
        <Table rowKey="id" columns={columns} dataSource={colaboradores} loading={loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Nenhum colaborador encontrado' }} />
      </Space>
    </Card>
  );
}

export default ColaboradoresPage;