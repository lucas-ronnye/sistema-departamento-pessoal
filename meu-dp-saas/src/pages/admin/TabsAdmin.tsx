import { Tabs } from 'antd';
import AdminClientesPage from './AdminClientesPage';
import AdminUsuariosPage from './AdminUsuariosPage';

const TabsAdmin = () => {
  const items = [
    {
      key: '1',
      label: 'Clientes',
      children: <AdminClientesPage />,
    },
    {
      key: '2',
      label: 'Usuários',
      children: <AdminUsuariosPage />,
    },
  ];

  return <Tabs defaultActiveKey="1" items={items} />;
};

export default TabsAdmin;
