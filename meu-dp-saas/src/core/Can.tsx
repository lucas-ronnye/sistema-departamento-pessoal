import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

type CanProps = {
  permissao: string
  children: ReactNode
}

function Can({ permissao, children }: CanProps) {
  const { user } = useAuth()
  const permissoes: string[] = Array.isArray(user?.permissoes) ? (user!.permissoes as string[]) : []

  if (!permissoes.includes(permissao)) {
    return null
  }

  return <>{children}</>
}

export default Can