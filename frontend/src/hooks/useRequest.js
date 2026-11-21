import { useCallback, useEffect, useState } from 'react'

export default function useRequest(load) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadData = useCallback(() => load(), [load])
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await loadData())
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [loadData])
  useEffect(() => {
    let active = true
    loadData()
      .then((result) => { if (active) setData(result) })
      .catch((err) => { if (active) setError(err.message || 'An unexpected error occurred.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadData])
  return { data, loading, error, refresh }
}
