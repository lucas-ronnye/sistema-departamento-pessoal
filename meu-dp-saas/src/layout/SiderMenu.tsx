import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  DollarOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import { useThemeMode } from '../core/ThemeContext'

function SiderMenu() {
  const location = useLocation()
  const path = location.pathname
  const mapToRootKey = (p: string) => {
    if (p.startsWith('/app/ponto')) return '/app/ponto'
    if (p.startsWith('/app/folha')) return '/app/folha'
    if (p.startsWith('/app/impostos')) return '/app/impostos'
    if (p.startsWith('/app/admin')) return '/app/admin'
    return p
  }
  const selectedKeys = [mapToRootKey(path)]
  const { mode } = useThemeMode()

  // No submenus anymore, so no default open keys

  // auth context disponível para futuras permissões; não usado no menu atual

  const items: MenuProps['items'] = [
    {
      key: '/app/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/app/dashboard">Dashboard</Link>,
    },
    // Acesso rápido do COLABORADOR
    {
      key: '/app/area-colaborador',
      icon: <UserOutlined />,
      label: <Link to="/app/area-colaborador">Área do Colaborador</Link>,
    },
    {
      key: '/app/bater-ponto',
      icon: <ClockCircleOutlined />,
      label: <Link to="/app/bater-ponto">Bater Ponto</Link>,
    },
    {
      key: '/app/colaboradores',
      icon: <UserOutlined />,
      label: <Link to="/app/colaboradores">Colaboradores</Link>,
    },
    {
      key: '/app/unidades',
      icon: <HomeOutlined />,
      label: <Link to="/app/unidades">Unidades Organizacionais</Link>,
    },
    // Item Parâmetros removido do app principal; disponível apenas via App Admin
    {
      key: '/app/ponto',
      icon: <ClockCircleOutlined />,
      label: <Link to="/app/ponto">Ponto e Escalas</Link>,
    },
    {
      key: '/app/folha',
      icon: <DollarOutlined />,
      label: <Link to="/app/folha">Folha de Pagamento</Link>,
    },
    {
      key: '/app/impostos',
      icon: <FileProtectOutlined />,
      label: <Link to="/app/impostos">Impostos e Obrigações</Link>,
    },
    {
      key: '/app/admin',
      icon: <SettingOutlined />,
      label: <Link to="/app/admin">App Admin</Link>,
    },
  ]

  return (
    <Menu
      theme={mode === 'dark' ? 'dark' : 'light'}
      mode="inline"
      selectedKeys={selectedKeys}
      // No submenus; defaultOpenKeys removed
      items={items}
    />
  )
}

export default SiderMenu