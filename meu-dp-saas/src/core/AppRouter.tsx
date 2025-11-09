import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import MainLayout from '../layout/MainLayout'
import { useAuth } from './AuthContext'
import ClientesPage from '../pages/ClientesPage.tsx'
import ColaboradoresPage from '../pages/ColaboradoresPage.tsx'
import FormColaborador from '../components/colaboradores/FormColaborador.tsx'
import JornadasPage from '../pages/ponto/JornadasPage.tsx'
import GradeEscalasPage from '../pages/ponto/GradeEscalasPage.tsx'
import EscalasPage from '../pages/ponto/EscalasPage.tsx'
import ApuracaoPage from '../pages/ponto/ApuracaoPage.tsx'
import PontoPage from '../pages/ponto/PontoPage.tsx'
import PWALayout from '../layout/PWALayout.tsx'
import BaterPontoPage from '../pages/pwa/BaterPontoPage.tsx'
import HoleritesPage from '../pages/pwa/HoleritesPage.tsx'
import PerfilPage from '../pages/pwa/PerfilPage.tsx'
import SolicitacoesPage from '../pages/pwa/SolicitacoesPage.tsx'
import BeneficiosPWAPage from '../pages/pwa/BeneficiosPage.tsx'
import ProcessarFolhaPage from '../pages/folha/ProcessarFolhaPage.tsx'
import RecibosPage from '../pages/folha/RecibosPage.tsx'
import FolhaPage from '../pages/folha/FolhaPage.tsx'
import AdminPage from '../pages/admin/AdminPage';
import ESocialPage from '../pages/impostos/eSocialPage.tsx'
import DCTFWebPage from '../pages/impostos/DCTFWebPage.tsx'
import ImpostosPage from '../pages/impostos/ImpostosPage.tsx'
import FGTSDigitalPage from '../pages/impostos/FGTSDigitalPage.tsx'
import RelatoriosPage from '../pages/RelatoriosPage.tsx'
import BeneficiosPage from '../pages/BeneficiosPage.tsx'
import DashboardPage from '../pages/DashboardPage.tsx'
import AreaColaboradorPage from '../pages/AreaColaboradorPage.tsx'
import FiliaisPage from '../pages/organizacao/FiliaisPage.tsx'
import LocaisTrabalhoPage from '../pages/organizacao/LocaisTrabalhoPage.tsx'
import UnidadesOrganizacionaisPage from '../pages/organizacao/UnidadesOrganizacionaisPage.tsx'

function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

// Página FGTS Digital agora é real e importada

export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <PrivateRoute />,
      children: [
        {
          path: '/app',
          element: <MainLayout />,
          children: [
            { path: 'dashboard', element: <DashboardPage /> },
            { path: 'bater-ponto', element: <BaterPontoPage /> },
            { path: 'area-colaborador', element: <AreaColaboradorPage /> },
            { path: 'clientes', element: <ClientesPage /> },
            { path: 'colaboradores', element: <ColaboradoresPage /> },
            { path: 'colaboradores/novo', element: <FormColaborador /> },
            { path: 'colaboradores/editar/:id', element: <FormColaborador /> },
            { path: 'filiais', element: <FiliaisPage /> },
            { path: 'locais-trabalho', element: <LocaisTrabalhoPage /> },
            { path: 'unidades', element: <UnidadesOrganizacionaisPage /> },
            { path: 'beneficios', element: <BeneficiosPage /> },
            // Parâmetros agora apenas no App Admin; rota removida do app principal
            // Versões colaborador (híbridas) no mesmo espaço da aplicação
            { path: 'holerites', element: <HoleritesPage /> },
            { path: 'perfil', element: <PerfilPage /> },
            { path: 'solicitacoes', element: <SolicitacoesPage /> },
            { path: 'meus-beneficios', element: <BeneficiosPWAPage /> },
            {
              path: 'ponto',
              element: <PontoPage />,
              children: [
                { index: true, element: <Navigate to="apuracao" replace /> },
                { path: 'apuracao', element: <ApuracaoPage /> },
                { path: 'escalas', element: <EscalasPage /> },
                { path: 'grade-escalas', element: <GradeEscalasPage /> },
                { path: 'jornadas', element: <JornadasPage /> },
              ],
            },
            {
              path: 'folha',
              element: <FolhaPage />,
              children: [
                { index: true, element: <Navigate to="processar" replace /> },
                { path: 'processar', element: <ProcessarFolhaPage /> },
                { path: 'recibos', element: <RecibosPage /> },
              ],
            },
            { path: 'admin', element: <AdminPage /> },
            {
              path: 'impostos',
              element: <ImpostosPage />,
              children: [
                { index: true, element: <Navigate to="esocial" replace /> },
                { path: 'esocial', element: <ESocialPage /> },
                { path: 'dctfweb', element: <DCTFWebPage /> },
                { path: 'fgts-digital', element: <FGTSDigitalPage /> },
              ],
            },
            { path: 'relatorios', element: <RelatoriosPage /> },
          ],
        },
        {
          path: '/pwa',
          element: <PWALayout />,
          children: [
            { path: 'ponto', element: <BaterPontoPage /> },
            { path: 'holerites', element: <HoleritesPage /> },
            { path: 'perfil', element: <PerfilPage /> },
            { path: 'solicitacoes', element: <SolicitacoesPage /> },
            { path: 'beneficios', element: <BeneficiosPWAPage /> },
          ],
        },
      ],
    },
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '*', element: <Navigate to="/login" replace /> },
  ]
)

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}