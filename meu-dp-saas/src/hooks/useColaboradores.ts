import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

export type Colaborador = {
  id: number
  nome: string
  cpf: string
  cargo: string
  salario: number
}

export function useColaboradores() {
  const [data, setData] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get<Colaborador[]>('/api/colaboradores')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteColaborador = useCallback(async (id: number) => {
    await axios.delete(`/api/colaboradores/${id}`)
    setData((prev) => prev.filter((c) => c.id !== id))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh, deleteColaborador }
}

export default useColaboradores