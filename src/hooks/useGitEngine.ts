import { useCallback, useEffect, useState } from 'react'
import { api, type Commit, type GitRepoResponse, type GitStatusFile } from '../api'
import { useStore } from '../store'

export interface GitEngineState {
  repo: GitRepoResponse | null
  status: GitStatusFile[]
  log: Commit[]
  loading: boolean
  error: string
}

export function useGitEngine() {
  const configured = useStore((s) => s.configured)
  const [repo, setRepo] = useState<GitRepoResponse | null>(null)
  const [status, setStatus] = useState<GitStatusFile[]>([])
  const [log, setLog] = useState<Commit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const repoInfo = await api.gitRepo()
      setRepo(repoInfo)
      if (repoInfo.isRepo) {
        const st = await api.gitStatus()
        setStatus(st.files)
        try {
          const lg = await api.gitLog()
          setLog(lg.commits)
        } catch {
          setLog([])
        }
      } else {
        setStatus([])
        setLog([])
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (configured) void refresh()
  }, [configured, refresh])

  return { repo, status, log, loading, error, refresh }
}
