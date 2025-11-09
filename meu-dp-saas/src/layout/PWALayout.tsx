import { Layout, Tabs } from 'antd'
import { ClockCircleOutlined, DollarOutlined, UserOutlined, FileDoneOutlined, GiftOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Content } = Layout

function PWALayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentKey = location.pathname.startsWith('/pwa/')
    ? location.pathname.replace('/pwa/', '')
    : 'ponto'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 16, paddingBottom: 80 }}>
        <Outlet />
      </Content>

      <Tabs
        tabPosition="bottom"
        activeKey={currentKey}
        onChange={(key) => navigate(`/pwa/${key}`)}
        items={[
          { key: 'ponto', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClockCircleOutlined /><span>Ponto</span></span>) },
          { key: 'holerites', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarOutlined /><span>Contracheques</span></span>) },
          { key: 'perfil', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserOutlined /><span>Perfil</span></span>) },
          { key: 'solicitacoes', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileDoneOutlined /><span>Solicitações</span></span>) },
          { key: 'beneficios', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GiftOutlined /><span>Benefícios</span></span>) },
        ]}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        className="mobile-tabs"
      />
    </Layout>
  )
}

export default PWALayout