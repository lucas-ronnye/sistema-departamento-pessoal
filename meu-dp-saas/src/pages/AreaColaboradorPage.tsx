import { Layout, Tabs } from 'antd'
import HoleritesPage from './pwa/HoleritesPage'
import SolicitacoesPage from './pwa/SolicitacoesPage'
import BeneficiosPWAPage from './pwa/BeneficiosPage'
import PerfilPage from './pwa/PerfilPage'

const { Content } = Layout

function AreaColaboradorPage() {
  return (
    <Layout style={{ minHeight: '100%', background: 'transparent' }}>
      <Content style={{ padding: 16 }}>
        <Tabs
          defaultActiveKey="solicitacoes"
          items={[
            { key: 'holerites', label: 'Contracheques', children: <HoleritesPage /> },
            { key: 'solicitacoes', label: 'Solicitações', children: <SolicitacoesPage /> },
            { key: 'beneficios', label: 'Benefícios', children: <BeneficiosPWAPage /> },
            { key: 'perfil', label: 'Perfil', children: <PerfilPage /> },
          ]}
        />
      </Content>
    </Layout>
  )
}

export default AreaColaboradorPage