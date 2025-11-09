import { Tabs, Breadcrumb, Space, Typography } from 'antd';
import FiliaisPage from './FiliaisPage';
import LocaisTrabalhoPage from './LocaisTrabalhoPage';

function UnidadesOrganizacionaisPage() {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb items={[{ title: 'Unidades Organizacionais' }]} />
      <Typography.Title level={3}>Unidades Organizacionais</Typography.Title>
      <Tabs
        defaultActiveKey="filiais"
        items={[
          { key: 'filiais', label: 'Filiais', children: <FiliaisPage /> },
          { key: 'locais', label: 'Locais de Trabalho', children: <LocaisTrabalhoPage /> },
        ]}
      />
    </Space>
  );
}

export default UnidadesOrganizacionaisPage;