export interface ConfigResponse {
  root: string
  configured: boolean
}

export interface FileListResponse {
  files: string[]
}

export interface FileContentResponse {
  path: string
  content: string
  encoding: 'utf8' | 'base64'
  ext: string
}

export interface GitRepoResponse {
  isRepo: boolean
  branch: string
  remote: string
}

export interface GitStatusFile {
  status: string
  file: string
}

export interface BrowseFile {
  name: string
  path: string
  ext: string
}

export interface BrowseResponse {
  path: string
  parent: string | null
  home: string
  quick: { name: string; path: string }[]
  dirs: string[]
  files: BrowseFile[]
}

export interface Commit {
  hash: string
  author: string
  date: string
  message: string
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`)
  return body as T
}

export const api = {
  getConfig: () => request<ConfigResponse>('/api/config'),
  setConfig: (root: string) =>
    request<ConfigResponse>('/api/config', { method: 'POST', body: JSON.stringify({ root }) }),
  listFiles: () => request<FileListResponse>('/api/files'),
  browse: (path?: string) =>
    request<BrowseResponse>(`/api/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  mkdir: (path: string) =>
    request<{ ok: boolean }>('/api/mkdir', { method: 'POST', body: JSON.stringify({ path }) }),
  readFile: (path: string) =>
    request<FileContentResponse>(`/api/file?path=${encodeURIComponent(path)}`),
  writeFile: (path: string, content: string) =>
    request<{ ok: boolean }>('/api/file', {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    }),
  createFile: (path: string) =>
    request<{ ok: boolean }>('/api/file', { method: 'POST', body: JSON.stringify({ path }) }),
  writeDocx: (path: string, content: string) =>
    request<{ ok: boolean }>('/api/file/docx', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  openFolder: (path?: string) =>
    request<{ ok: boolean }>('/api/open-folder', {
      method: 'POST',
      body: JSON.stringify({ path: path || '' }),
    }),
  gitRepo: () => request<GitRepoResponse>('/api/git/repo'),
  gitStatus: () => request<{ files: GitStatusFile[] }>('/api/git/status'),
  gitDiff: () => request<{ diff: string }>('/api/git/diff'),
  gitCommit: (message: string, files?: string[]) =>
    request<{ ok: boolean; hash: string }>('/api/git/commit', {
      method: 'POST',
      body: JSON.stringify({ message, files }),
    }),
  gitPush: (branch?: string) =>
    request<{ ok: boolean; output: string }>('/api/git/push', {
      method: 'POST',
      body: JSON.stringify({ branch }),
    }),
  gitPull: (branch?: string) =>
    request<{ ok: boolean; output: string }>('/api/git/pull', {
      method: 'POST',
      body: JSON.stringify({ branch }),
    }),
  gitLog: () => request<{ commits: Commit[] }>('/api/git/log'),
}
