import { useEffect, useState } from 'react'
import { Layout, Button, Typography, Switch, theme, Avatar, Tooltip, Tabs, Grid, Space } from 'antd'
import { PoweroffOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, DownloadOutlined, DashboardOutlined, ClockCircleOutlined, DollarOutlined, FileDoneOutlined, GiftOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SiderMenu from './SiderMenu.tsx'
import './MainLayout.css'
import { useAuth } from '../core/AuthContext'
import { useThemeMode } from '../core/ThemeContext'
import rhLogo from '../assets/logo-rh-digital.svg'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { mode, toggle } = useThemeMode()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  // Tratar como layout mobile abaixo de 992px (lg), para evitar sidebar ocupando espaço em telas medianas
  const isMobile = !screens.lg
  const navigate = useNavigate()
  const location = useLocation()

  // Install PWA support
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const onInstallClick = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const currentMobileKey = (() => {
    const p = location.pathname
    if (p.startsWith('/app/bater-ponto')) return 'ponto'
    if (p.startsWith('/app/holerites')) return 'holerites'
    if (p.startsWith('/app/meus-beneficios')) return 'beneficios'
    if (p.startsWith('/app/solicitacoes')) return 'solicitacoes'
    if (p.startsWith('/app/perfil')) return 'perfil'
    return 'dashboard'
  })()

  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 16,
          }}
        >
          <Space align="center" style={{ gap: 8 }}>
            <img src={rhLogo} alt="RH Digital" style={{ height: 24 }} />
          </Space>
          <Space>
            {installPrompt && (
              <Button type="primary" icon={<DownloadOutlined />} size="small" onClick={onInstallClick}>
                Instalar App
              </Button>
            )}
          </Space>
        </Header>
        <Content style={{ margin: 16, marginBottom: 80 }}>
          <Outlet />
        </Content>
        <Tabs
          tabPosition="bottom"
          activeKey={currentMobileKey}
          onChange={(key) => {
            switch (key) {
              case 'dashboard':
                navigate('/app/dashboard'); break
              case 'ponto':
                navigate('/app/bater-ponto'); break
              case 'holerites':
                navigate('/app/holerites'); break
              case 'beneficios':
                navigate('/app/meus-beneficios'); break
              case 'solicitacoes':
                navigate('/app/solicitacoes'); break
              case 'perfil':
                navigate('/app/perfil'); break
            }
          }}
          items={[
            { key: 'dashboard', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DashboardOutlined /><span>Home</span></span>) },
            { key: 'ponto', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClockCircleOutlined /><span>Ponto</span></span>) },
            { key: 'holerites', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarOutlined /><span>Contracheques</span></span>) },
            { key: 'beneficios', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GiftOutlined /><span>Benefícios</span></span>) },
            { key: 'solicitacoes', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileDoneOutlined /><span>Solicitações</span></span>) },
            { key: 'perfil', label: (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserOutlined /><span>Perfil</span></span>) },
          ]}
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
          className="mobile-tabs"
        />
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme={mode === 'dark' ? 'dark' : 'light'}
        style={{ position: 'relative' }}
        width={260}
        className="app-sider"
      >
        <div
          style={{
            color: '#fff',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {collapsed ? (
            <Typography.Text strong>RH</Typography.Text>
          ) : (
            <img src={rhLogo} alt="RH Digital" style={{ height: 24 }} />
          )}
          <Button
            type="text"
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            style={{ color: '#fff' }}
          />
        </div>
        <SiderMenu />

        {/* Controles no rodapé do Sidebar */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text style={{ color: mode === 'dark' ? '#cbd5e1' : '#334155' }}>
              {collapsed ? '' : 'Tema'}
            </Typography.Text>
            <Switch
              checked={mode === 'dark'}
              onChange={toggle}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </div>

          {collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tooltip title={user?.nome ? user.nome : 'Usuário'}>
                <Avatar size="small" icon={<UserOutlined />} />
              </Tooltip>
              <Tooltip title="Logout">
                <Button icon={<PoweroffOutlined />} onClick={logout} size="small" />
              </Tooltip>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography.Text style={{ color: mode === 'dark' ? '#e2e8f0' : token.colorText }}>
                {user?.nome ? user.nome : 'Usuário'}
              </Typography.Text>
              <Button onClick={logout} size="small">Logout</Button>
            </div>
          )}
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          {installPrompt && (
            <Button type="primary" icon={<DownloadOutlined />} size="small" onClick={onInstallClick}>
              Instalar App
            </Button>
          )}
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout