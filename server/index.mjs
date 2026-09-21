import http from 'node:http'
import os from 'node:os'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { execFile, exec } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist'])
const TEXT_EXTS = new Set(['.md', '.txt', '.csv'])
const BINARY_EXTS = new Set(['.docx', '.xlsx', '.xls'])
const ALL_EXTS = new Set([...TEXT_EXTS, ...BINARY_EXTS])

let rootDir = process.env.NOVEL_ROOT || ''

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
}

function json(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req, limit = 10 * 1024 * 1024) {
  const contentType = req.headers['content-type'] || ''
  if (!contentType.includes('application/json')) {
    return Promise.resolve({})
  }
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('Body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function requireRoot() {
  if (!rootDir || !fs.existsSync(rootDir)) {
    throw new Error('No valid working directory configured. Set it first.')
  }
}

function resolveSafe(relPath) {
  const resolved = path.resolve(rootDir, relPath)
  if (resolved !== path.resolve(rootDir) && !resolved.startsWith(path.resolve(rootDir) + path.sep)) {
    throw new Error('Path escapes working directory')
  }
  return resolved
}

function resolveOpen(relOrAbs) {
  if (path.isAbsolute(relOrAbs)) return path.normalize(relOrAbs)
  const base = rootDir && fs.existsSync(rootDir) ? rootDir : os.homedir()
  const resolved = path.resolve(base, relOrAbs)
  if (resolved !== path.resolve(base) && !resolved.startsWith(path.resolve(base) + path.sep)) {
    throw new Error('Path escapes working directory')
  }
  return resolved
}

async function listFiles() {
  const results = []
  async function walk(dir) {
    let entries
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(path.join(dir, entry.name))
        continue
      }
      if (entry.isFile() && ALL_EXTS.has(path.extname(entry.name).toLowerCase())) {
        results.push(path.relative(rootDir, path.join(dir, entry.name)).split(path.sep).join('/'))
      }
    }
  }
  await walk(rootDir)
  results.sort((a, b) => a.localeCompare(b))
  return results
}

function extOf(relPath) {
  return path.extname(relPath).toLowerCase()
}

async function readFilePayload(relPath) {
  const ext = extOf(relPath)
  if (!ALL_EXTS.has(ext)) throw new Error(`Unsupported file type: ${ext}`)
  const abs = resolveOpen(relPath)
  if (TEXT_EXTS.has(ext)) {
    return { path: relPath, content: await fsp.readFile(abs, 'utf-8'), encoding: 'utf8', ext }
  }
  return { path: relPath, content: (await fsp.readFile(abs)).toString('base64'), encoding: 'base64', ext }
}

async function writeFileSafe(relPath, content) {
  if (!TEXT_EXTS.has(extOf(relPath))) throw new Error('Only text files (.md, .txt, .csv) can be written')
  const abs = resolveOpen(relPath)
  await fsp.mkdir(path.dirname(abs), { recursive: true })
  await fsp.writeFile(abs, content, 'utf-8')
}

async function writeDocxSafe(relPath, textContent) {
  if (extOf(relPath) !== '.docx') throw new Error('Only .docx files can be written via this endpoint')
  const abs = resolveOpen(relPath)
  const { Document, Packer, Paragraph, TextRun } = await import('docx')
  const paragraphs = textContent.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24 })],
      })
  )
  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  })
  const buffer = await Packer.toBuffer(doc)
  await fsp.mkdir(path.dirname(abs), { recursive: true })
  await fsp.writeFile(abs, buffer)
}

async function createFileSafe(relPath) {
  if (!TEXT_EXTS.has(extOf(relPath))) throw new Error('Only text files can be created')
  const abs = resolveOpen(relPath)
  try {
    await fsp.access(abs)
    throw new Error('File already exists')
  } catch (err) {
    if (err.message === 'File already exists') throw err
  }
  await fsp.mkdir(path.dirname(abs), { recursive: true })
  await fsp.writeFile(abs, '', 'utf-8')
}

async function git(args) {
  const { stdout } = await execFileAsync('git', args, {
    cwd: rootDir,
    maxBuffer: 10 * 1024 * 1024,
  })
  return stdout
}

async function gitIsRepo() {
  try {
    await git(['rev-parse', '--is-inside-work-tree'])
    return true
  } catch {
    return false
  }
}

async function gitBranch() {
  try {
    return (await git(['branch', '--show-current'])).trim()
  } catch {
    return ''
  }
}

async function gitRemote() {
  try {
    return (await git(['remote', 'get-url', 'origin'])).trim()
  } catch {
    return ''
  }
}

async function handleApi(req, res, pathname) {
  try {
    if (pathname === '/api/config' && req.method === 'GET') {
      json(res, 200, { root: rootDir, configured: !!rootDir && fs.existsSync(rootDir) })
      return true
    }
    if (pathname === '/api/config' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.root || typeof body.root !== 'string') throw new Error('Missing "root" field')
      const resolved = path.resolve(body.root)
      if (!fs.existsSync(resolved)) throw new Error(`Directory does not exist: ${resolved}`)
      rootDir = resolved
      json(res, 200, { root: rootDir, configured: true })
      return true
    }

    if (pathname === '/api/browse' && req.method === 'GET') {
      const urlObj = new URL(req.url, 'http://x')
      let target = urlObj.searchParams.get('path') || ''
      if (!target) {
        target = rootDir && fs.existsSync(rootDir) ? rootDir : os.homedir()
      } else {
        target = path.normalize(path.resolve(target))
      }
      if (!fs.existsSync(target)) throw new Error(`Path does not exist: ${target}`)
      let entries
      try {
        entries = await fsp.readdir(target, { withFileTypes: true })
      } catch (err) {
        throw new Error(`Cannot read directory: ${target} (${err?.code || err?.message || ''})`)
      }
      const dirs = []
      const files = []
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          dirs.push(entry.name)
        } else if (entry.isFile() && ALL_EXTS.has(extOf(entry.name))) {
          files.push({ name: entry.name, path: path.join(target, entry.name), ext: extOf(entry.name) })
        }
      }
      dirs.sort((a, b) => a.localeCompare(b))
      files.sort((a, b) => a.name.localeCompare(b.name))
      const parentDir = path.dirname(target)
      const home = os.homedir()
      const quick = []
      const addQuick = (name, p) => {
        if (p !== target && fs.existsSync(p)) quick.push({ name, path: p })
      }
      addQuick('Home', home)
      addQuick('Documents', path.join(home, 'Documents'))
      addQuick('Downloads', path.join(home, 'Downloads'))
      addQuick('Desktop', path.join(home, 'Desktop'))
      json(res, 200, {
        path: target,
        parent: target === parentDir ? null : parentDir,
        home,
        quick,
        dirs,
        files,
      })
      return true
    }
    if (pathname === '/api/mkdir' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.path || typeof body.path !== 'string') throw new Error('Missing "path"')
      const abs = path.normalize(path.resolve(body.path))
      await fsp.mkdir(abs, { recursive: true })
      json(res, 200, { ok: true })
      return true
    }

    if (pathname === '/api/files' && req.method === 'GET') {
      requireRoot()
      json(res, 200, { files: await listFiles() })
      return true
    }
    if (pathname === '/api/file' && req.method === 'GET') {
      const urlObj = new URL(req.url, 'http://x')
      const relPath = urlObj.searchParams.get('path') ?? ''
      if (!relPath) throw new Error('Missing "path" query param')
      json(res, 200, await readFilePayload(relPath))
      return true
    }
    if (pathname === '/api/file' && req.method === 'PUT') {
      const body = await readBody(req)
      if (!body.path || typeof body.content !== 'string') throw new Error('Missing "path" or "content"')
      await writeFileSafe(body.path, body.content)
      json(res, 200, { ok: true })
      return true
    }
    if (pathname === '/api/file' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.path) throw new Error('Missing "path"')
      await createFileSafe(body.path)
      json(res, 200, { ok: true })
      return true
    }
    if (pathname === '/api/file/docx' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.path || typeof body.content !== 'string') throw new Error('Missing "path" or "content"')
      await writeDocxSafe(body.path, body.content)
      json(res, 200, { ok: true })
      return true
    }
    if (pathname === '/api/open-folder' && req.method === 'POST') {
      const body = await readBody(req).catch(() => ({}))
      const targetDir = body.path || rootDir
      console.log('[open-folder] targetDir:', targetDir, 'rootDir:', rootDir, 'body:', body)
      if (!targetDir) throw new Error('No directory configured')
      if (!fs.existsSync(targetDir)) throw new Error(`Directory does not exist: ${targetDir}`)
      const platform = process.platform
      let cmd
      if (platform === 'darwin') {
        cmd = `open "${targetDir}"`
      } else if (platform === 'win32') {
        cmd = `explorer "${targetDir}"`
      } else {
        cmd = `xdg-open "${targetDir}"`
      }
      console.log('[open-folder] running:', cmd)
      execAsync(cmd).catch((err) => console.error('[open-folder] exec error:', err.message))
      json(res, 200, { ok: true })
      return true
    }
    if (pathname === '/api/git/repo' && req.method === 'GET') {
      requireRoot()
      const isRepo = await gitIsRepo()
      json(res, 200, {
        isRepo,
        branch: isRepo ? await gitBranch() : '',
        remote: isRepo ? await gitRemote() : '',
      })
      return true
    }
    if (pathname === '/api/git/status' && req.method === 'GET') {
      const out = await git(['status', '--porcelain'])
      const files = out
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((line) => ({ status: line.slice(0, 2).trim(), file: line.slice(3).trim() }))
      json(res, 200, { files })
      return true
    }
    if (pathname === '/api/git/diff' && req.method === 'GET') {
      json(res, 200, { diff: await git(['diff']) })
      return true
    }
    if (pathname === '/api/git/commit' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.message || typeof body.message !== 'string') throw new Error('Missing "message"')
      const files = Array.isArray(body.files) && body.files.length > 0 ? body.files : null
      if (files) {
        for (const f of files) await git(['add', '--', f])
      } else {
        await git(['add', '-A'])
      }
      await git(['commit', '-m', body.message])
      let hash = ''
      try {
        hash = (await git(['rev-parse', 'HEAD'])).trim()
      } catch {}
      json(res, 200, { ok: true, hash })
      return true
    }
    if ((pathname === '/api/git/push' || pathname === '/api/git/pull') && req.method === 'POST') {
      const body = await readBody(req)
      const branch = body.branch || (await gitBranch())
      const out = await git([pathname.endsWith('/push') ? 'push' : 'pull', 'origin', branch])
      json(res, 200, { ok: true, output: out.trim() })
      return true
    }
    if (pathname === '/api/git/log' && req.method === 'GET') {
      const out = await git(['log', '-20', '--pretty=format:%h|%an|%ad|%s', '--date=short'])
      const commits = out
        .split('\n')
        .filter((l) => l.includes('|'))
        .map((line) => {
          const [hash, author, date, ...rest] = line.split('|')
          return { hash, author, date, message: rest.join('|') }
        })
      json(res, 200, { commits })
      return true
    }

    json(res, 404, { error: `No route: ${req.method} ${pathname}` })
    return true
  } catch (err) {
    const msg = String(err?.message ?? err).replace(/\n/g, ' ').slice(0, 500)
    json(res, err instanceof Error && /does not exist|Cannot read|Unsupported|Only text|already exists|escapes|Missing|Invalid|No valid/.test(msg) ? 400 : 500, {
      error: `Error: ${msg}`,
    })
    return true
  }
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname)
  if (rel === '/') rel = '/index.html'
  const abs = path.resolve(DIST_DIR, '.' + rel)
  if (!abs.startsWith(DIST_DIR + path.sep) && abs !== DIST_DIR) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  fs.stat(abs, (err, stat) => {
    if (!err && stat.isFile()) {
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      })
      fs.createReadStream(abs).pipe(res)
      return
    }
    const indexPath = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      fs.createReadStream(indexPath).pipe(res)
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://x').pathname
  if (pathname.startsWith('/api/')) {
    const handled = await handleApi(req, res, pathname)
    if (handled) return
  }
  serveStatic(req, res, pathname)
})

server.listen(PORT, '127.0.0.1', () => {
  const hasDist = fs.existsSync(path.join(DIST_DIR, 'index.html'))
  console.log(
    `Novel editor listening on http://localhost:${PORT}${hasDist ? '' : ' (API only — run "npm run build" to serve the UI)'}`
  )
})
