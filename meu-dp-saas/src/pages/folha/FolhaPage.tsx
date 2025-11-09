import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const FolhaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/app/folha/processar', label: 'Processar Folha' },
    { key: '/app/folha/recibos', label: 'Recibos' },
  ];

  const onChange = (key: string) => {
    navigate(key);
  };

  return (
    <div>
      <Tabs activeKey={location.pathname} items={items} onChange={onChange} />
      <Outlet />
    </div>
  );
};

export default FolhaPage;