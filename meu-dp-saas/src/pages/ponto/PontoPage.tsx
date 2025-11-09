import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const PontoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      key: '/app/ponto/apuracao',
      label: 'Apuração',
    },
    {
      key: '/app/ponto/grade-escalas',
      label: 'Grade de Escalas',
    },
    {
      key: '/app/ponto/jornadas',
      label: 'Jornadas',
    },
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

export default PontoPage;
