import { Tabs } from 'antd';
import { useAuth } from '../../core/AuthContext';
import AdminClientesPage from './AdminClientesPage';
import AdminUsuariosPage from './AdminUsuariosPage';
import AdminParametrosPage from './AdminParametrosPage';

function AdminPage() {
  const { user } = useAuth();
  const permissoes: string[] = Array.isArray(user?.permissoes) ? (user!.permissoes as string[]) : [];

  const items = [
    {
      key: 'clientes',
      label: 'Clientes & Domínios',
      children: <AdminClientesPage />,
    },
    {
      key: 'usuarios',
      label: 'Usuários',
      children: <AdminUsuariosPage />,
    },
    ...(permissoes.includes('editar_parametros')
      ? [
          {
            key: 'parametros',
            label: 'Parâmetros',
            children: <AdminParametrosPage />,
          },
        ]
      : []),
  ];

  return <Tabs defaultActiveKey="clientes" items={items} />;
}

export default AdminPage;
