import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './core/AppRouter.tsx'
import { AuthProvider } from './core/AuthContext.tsx'
import { ThemeProvider } from './core/ThemeContext.tsx'
import { App as AntApp } from 'antd';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
