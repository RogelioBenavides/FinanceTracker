import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.ts'

const STORAGE_KEY = 'selectedPeriodId'

export function usePeriod() {
  const { data: periods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: api.periods.list,
  })

  const [periodId, setPeriodIdRaw] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored) : null
  })

  useEffect(() => {
    if (periodId === null && periods.length > 0) {
      setPeriodIdRaw(periods[periods.length - 1].id)
    }
  }, [periods, periodId])

  const setPeriodId = (id: number) => {
    localStorage.setItem(STORAGE_KEY, String(id))
    setPeriodIdRaw(id)
  }

  const selectedPeriod = periods.find((p) => p.id === periodId) ?? periods[periods.length - 1] ?? null

  return { periodId: selectedPeriod?.id ?? null, selectedPeriod, periods, setPeriodId }
}
