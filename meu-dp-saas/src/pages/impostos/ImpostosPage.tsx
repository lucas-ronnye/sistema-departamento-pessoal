import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const ImpostosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/app/impostos/esocial', label: 'eSocial' },
    { key: '/app/impostos/dctfweb', label: 'DCTFWeb' },
    { key: '/app/impostos/fgts-digital', label: 'FGTS Digital' },
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

export default ImpostosPage;