# Light Novel Markdown Editor — Development Progress

This file tracks all development steps, changes, and status for the project.

---

## Step 1: Initialize Project & Setup PWA Environment
> **Status:** Complete

### Tasks
- [x] Scaffold Vite + React + TypeScript project (`light-novel-editor/`)
- [x] Install dependencies (markdown-it, zustand, diff, express, cors, concurrently, tsx)
- [x] Configure Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- [x] Configure PWA manifest (`public/manifest.json`) & service worker (`public/sw.js`)
- [x] Verify dev server runs (HTTP 200 on :5173) & production build passes

### Changes Log
- Scaffolded `light-novel-editor` with Vite 8 + React 19 + TS 6 template
- Installed runtime deps: `markdown-it`, `zustand`, `diff`, `express`, `cors`, `concurrently`
- Installed dev deps: `tailwindcss`, `@tailwindcss/vite`, `tsx`, type packages
- `vite.config.ts`: added Tailwind plugin + `/api` proxy to backend at `localhost:3001`
- Replaced default `src/index.css` with Tailwind import
- Created `public/manifest.json` (PWA install metadata) and `public/sw.js` (offline cache service worker)
- Registered service worker in `src/main.tsx`; linked manifest in `index.html` with theme color
- Cleaned out Vite boilerplate (`App.css`, demo assets)
- Added npm scripts: `dev` (frontend+backend via concurrently), `dev:frontend`, `dev:backend`
- Verified: `npm run build` compiles cleanly; dev server serves HTTP 200

---

## Step 2: Build Node.js Backend (File Bridge + Git Bridge)
> **Status:** Complete

### Tasks
- [x] Create Express server in `server/` (port 3001)
- [x] Implement `fileBridge.ts` — read/write/list/create `.md` files from working directory
- [x] Implement `gitBridge.ts` — shell out to native `git` CLI (status, add, commit, push, pull, diff, log)
- [x] Expose REST API endpoints
- [x] Test backend endpoints end-to-end

### REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get current working directory |
| POST | `/api/config` | Set working directory (`{root}`) |
| GET | `/api/files` | Recursive list of all `.md` files |
| GET | `/api/file?path=` | Read a markdown file |
| PUT | `/api/file` | Write file content (`{path, content}`) |
| POST | `/api/file` | Create empty `.md` file (`{path}`) |
| GET | `/api/git/repo` | Repo status, current branch, remote URL |
| GET | `/api/git/status` | Porcelain status of changed files |
| GET | `/api/git/diff` | Full working-tree diff output |
| POST | `/api/git/commit` | Stage (`{files?}`) + commit (`{message}`) |
| POST | `/api/git/push` | Push current/default branch to origin |
| POST | `/api/git/pull` | Pull from origin |
| GET | `/api/git/log` | Recent 20 commits |

### Changes Log
- Created `server/config.ts` — working-directory state + path-traversal-safe resolver (`resolveSafe`)
- Created `server/fileBridge.ts` — recursive `.md` listing (skips `node_modules`, `.git`, `dist`), read/write/create with safe paths
- Created `server/gitBridge.ts` — native git CLI wrapper using `execFile`; handles unborn HEAD repos gracefully
- Created `server/index.ts` — Express app wiring all routes, JSON body parsing, root-dir guard middleware
- Fixed bug: `getCurrentBranch` now uses `git branch --show-current` (works on repos with no commits yet)
- Fixed bug: added missing `getLatestCommitHash()` used by commit endpoint
- Verified against a live test repo: config set/get, file list/read/write/create, git status/diff/commit/log, push error surfaced cleanly when no remote exists (expected in test env; real Chromebook repo will have SSH origin)

---

## Step 3: Build Real-Time Editor & Table of Contents
> **Status:** Complete

### Tasks
- [x] Build `EditorCanvas.tsx` — live split-pane editor with instant preview
- [x] Ensure full H1–H6 heading rendering support
- [x] Build `tocGenerator.ts` utility — parse headings to TOC tree
- [x] Build `TableOfContents.tsx` — collapsible TOC sidebar with click-to-scroll
- [x] Build `ChapterList.tsx` — file list sidebar with create-new-chapter
- [x] Wire up Zustand store for active file/content/TOC state
- [x] Connect frontend to backend file bridge API (with 1s auto-save debounce)

### Changes Log
- Created `src/api.ts` — typed fetch client for all backend REST endpoints
- Created `src/store.ts` — Zustand store: root config, file list, active file, content, dirty/saving state, font family/size/line-height, focus mode, auto-save timer (1s debounce)
- Created `src/utils/tocGenerator.ts` — `slugify`, `buildTree` (flat heading list → nested TocNode tree), `ParsedDocument` type
- Created `src/utils/markdown.ts` — markdown-it instance with custom core rule assigning unique heading IDs (duplicate-safe slugs) and collecting headings in the same pass, guaranteeing TOC/HTML ID consistency
- Created `src/utils/novelFormatter.ts` — word/char/paragraph counts + reading time
- Created `src/components/ChapterList.tsx` — left sidebar, inline new-file input, active highlight
- Created `src/components/EditorCanvas.tsx` — textarea + rendered preview split pane; listens for TOC navigation events and scrolls both panes; empty-state placeholder; preview toggle
- Created `src/components/TableOfContents.tsx` — collapsible nested heading tree, click dispatches scroll event, depth indentation, H-level badges
- Created `src/components/SetupDialog.tsx` — modal to enter working directory path (shown until backend configured)
- Created `src/components/StatusBar.tsx` — live word/char/paragraph/read-time + save state indicator
- Rewrote `src/App.tsx` — header (font toggle serif/sans, size slider, TOC toggle, focus mode), three-pane layout, status bar, error toast, config bootstrap on load
- Added novel-preview CSS: full H1–H6 hierarchy, light-novel style `text-indent: 2em` paragraphs with justified text, blockquote/list/table/code styling
- Fixed TS errors: removed conflicting `@types/markdown-it` (v15 ships own types); added missing `ParsedDocument` export
- Verified: production build passes; all modules serve HTTP 200 through Vite dev server

---

## Step 4: Implement Git Connectivity & Diff Viewer
> **Status:** Complete

### Tasks
- [x] Build `SyncPanel.tsx` — commit message input, push/pull buttons, status display
- [x] Wire `useGitEngine.ts` hook to backend git endpoints
- [x] Build `DiffViewer.tsx` — color-coded line-by-line change display
- [x] Pre-commit review flow

### Changes Log
- Created `src/utils/diffParser.ts` — unified diff parser producing typed lines (`add`/`del`/`hunk`/`meta`/`ctx`)
- Created `src/components/DiffViewer.tsx` — monospace color-coded diff render: green additions, red deletions, purple hunk headers, file names as section headers; clean-tree empty state
- Rewrote `src/hooks/useGitEngine.ts` (replaced earlier broken draft) — loads repo info, porcelain status, and commit log via backend API; auto-refreshes when root becomes configured; exposes single `refresh()`
- Created `src/components/SyncPanel.tsx` — right slide-over panel: branch + remote display, changed-file list with status badges, "Review changes before commit" inline diff toggle, commit message box, **Commit** / **Commit & Push** buttons, Pull Latest, Refresh Status, recent commits list
- Updated `src/App.tsx`:
  - Header now has **Git Sync** button opening the SyncPanel slide-over
  - Focus mode: floating exit button + Esc key exits distraction-free mode
  - Ctrl+S / Cmd+S triggers immediate manual save
- Fixed lint warnings in `EditorCanvas.tsx`: reordered `scrollToHeading` before its consumer effect, memoized with `useCallback`, replaced O(n²) duplicate-slug scan with a linear `Set`-based pass matching markdown-it ID logic
- Verified: production build passes; oxlint clean except one acceptable async-fetch pattern warning; all new modules serve HTTP 200 through Vite

---

## Step 5: Polish Responsive Layout & Mobile Deployment
> **Status:** Complete

### Tasks
- [x] Responsive layout for Chromebook/tablet/phone
- [x] Distraction-free fullscreen mode (Esc / floating button to exit)
- [x] Typographic customization (font toggle, size + line-height sliders, persisted)
- [x] PWA service worker configuration (offline caching from Step 1) + valid manifest icon
- [ ] Optional Capacitor wrapper for Android APK (documented only — optional per architecture doc)

### Changes Log
- `src/store.ts`: wrapped store in zustand `persist` middleware — font family, size, line-height and TOC visibility now survive reloads; added `chaptersDrawer` state
- `src/components/ChapterList.tsx`: responsive dual-mode — inline sidebar at `md+`, slide-in drawer with backdrop below `md`; larger touch targets on mobile; drawer auto-closes after picking a chapter
- `src/components/TableOfContents.tsx`: inline sidebar at `lg+`, overlay drawer with backdrop + close button below `lg`; backdrop click closes
- `src/App.tsx`:
  - Hamburger button (`md:hidden`) opens the chapters drawer on small screens
  - Added **line-height slider** (`lg+`) completing the typographic controls
  - TOC button now reflects open/closed state
  - Focus mode: floating exit button top-right + Esc shortcut (from Step 4)
- Created `public/icon.svg` (purple book glyph); updated `manifest.json` to reference it (replaces missing PNG icons so PWA install prompt works)
- Verified: production build passes; lint clean (one acceptable async-fetch warning); full smoke test green — `/`, `manifest.json`, `icon.svg`, App module, and `/api/config` through the Vite proxy all HTTP 200

---

## Deployment Notes

### Production mode (single server, zero dependencies)
- Server rewritten as **`server/index.mjs`** — plain Node.js using only built-in modules (`http`, `fs`, `path`, `child_process`). Express, cors and tsx removed entirely.
- One process serves the app + API + static assets on port 3001.
- New scripts: `npm start` (build + serve) and `npm run serve` (serve existing build only).
- Verified end-to-end: config, file list/read/write/create, git status/diff/commit/log/repo — all green on the dependency-free server.

### Chromebook storage reality (measured)
| Item | Size | Needed on Chromebook? |
|------|------|----------------------|
| App source code | 104 KB | Yes |
| Built app (`dist/`) | 1.24 MB | Yes |
| Runtime npm packages | **0 MB** | **No — server uses only Node built-ins** |
| Dev `node_modules` (vite/react/tsc…) | ~135 MB | No — dev machine only |
| Node.js runtime (via nvm) | ~110 MB | Yes (one-time, shared system-wide) |

**Chromebook total ≈ 112 MB**, of which ~110 MB is Node.js itself. The app adds ~1.4 MB.

To skip even the one-time `npm install` on the Chromebook: build once on Windows (`npm run build`), then commit/push the `dist/` folder too (remove it from `.gitignore`). The Chromebook clone then runs with just `node server/index.mjs` — no install step at all.

### Deploying to the Chromebook (Linux / Crostini)
The 150+ MB project folder is almost entirely `node_modules` (dev dependencies). It is never deployed — a fresh `npm install` recreates it on target. What actually ships: source (~1 MB) + build output (~2 MB).

```bash
# 1. Push this project to its own GitHub repo (from Windows), e.g.:
git init && git add -A && git commit -m "Novel editor"
gh repo create novel-editor --private --source=. --push

# 2. On the Chromebook Linux terminal — install Node.js if needed:
sudo apt update && sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
exec bash
nvm install 22

# 3. Clone + run:
git clone git@github.com:NitheeshPrahalath/novel-editor.git
cd novel-editor
npm install
npm start           # builds then serves on http://localhost:3001

# 4. Open http://localhost:3001 in Chrome → menu →
#    Cast, save, and share → Install page as app

# 5. Point it at your novel repo: clone your novel GitHub repo into
#    the Linux filesystem first, e.g. /home/YOUR_USER/Legacy-of-Lost-Earth
#    (Crostini cannot see OneDrive; use git clone with your SSH key),
#    then enter that path in the app's setup dialog.
```

Keep it running after closing the terminal: `nohup npx tsx server/index.ts &`

### Running on Windows (current setup)
```bash
cd light-novel-editor
npm install
npm run dev         # dev mode: frontend :5173 + backend :3001
# or production:    npm start  → single server :3001
```

### Android APK (optional)
The codebase is Capacitor-ready if Play Store distribution is ever wanted:
```bash
npm i @capacitor/core @capacitor/cli
npx cap init "Novel Editor" com.example.noveleditor --web-dir=dist
```
Note: the git/file bridge is a localhost Node server, so a mobile build would need the backend running in Termux or replaced with isomorphic-git — out of scope for the Chromebook-first workflow.

---

## Post-Launch Fixes & Enhancements
> **Status:** Complete

### Issues reported by user (all resolved)

| # | Issue | Root cause | Fix |
|---|-------|-----------|-----|
| 1 | No dark/night mode | Feature missing | Theme toggle in header (sun/moon icon), persisted via localStorage, full dark palette across every component incl. preview prose |
| 2 | Not all md files visible | Frontend loaded file list once at startup and never refreshed — backend always saw all files | Auto-refresh: manual refresh button, window-focus listener, 15s poll |
| 4 | New md file created in Explorer not visible | Same staleness as #2 | Same fix |
| 5 | New file missing from Git changes | SyncPanel status was stale from before file existed | Pull now reloads file list; status refreshes each panel open; Refresh Status button exists |

### Issue 5 explanation — no manual `git add` needed
The **Commit** and **Commit & Push** buttons run `git add -A` server-side before committing, so untracked new files (`??` badge) are staged automatically. Just open Git Sync → type message → Commit & Push.

### Issue 3 answer — multi-format support (implemented)
- **.txt / .csv** — fully editable, plain-text mode (no markdown preview)
- **.docx** — read-only rendered view via `mammoth` (Word styles mapped to H1/H2)
- **.xlsx / .xls** — read-only spreadsheet tables via SheetJS `xlsx`, multi-sheet tabs, row numbers
- Sidebar shows colored format badges (MD/TXT/DOCX/XLSX/XLS/CSV); non-text files show a "Read-only viewer" banner
- Backend lists/reads all supported extensions; binary files served base64; writes restricted to text formats

### Bundle size impact (measured after build)
| Chunk | Gzip | When downloaded |
|-------|------|----------------|
| Initial app bundle | ~117 KB | Always |
| DocxViewer (mammoth) | ~119 KB | Only when opening a .docx |
| SheetViewer (xlsx) | ~141 KB | Only when opening .xlsx/.xls |
| CSS | ~7 KB | Always |

**Expected Chromebook footprint:** installed PWA ≈ **2 MB** worst case (all chunks cached by service worker); dev-only `node_modules` (~60 MB) never ships or installs. Negligible for any Chromebook.

### Technical changes
- `server/fileBridge.ts`: multi-extension support (`.md .txt .csv .docx .xlsx .xls`), binary reads return base64, writes locked to text types
- `src/store.ts`: `theme` (persisted) + `editable` flag; binary files can't trigger autosave
- `src/components/DocxViewer.tsx`, `SheetViewer.tsx`: lazy-loaded viewers (dynamic import → code-split chunks)
- `src/components/EditorCanvas.tsx`: routes by extension; ViewOnlyBar banner for non-editable files
- `src/App.tsx`: theme class toggling on `<html>`, focus/poll-based file list refresh
- Added `@custom-variant dark` to Tailwind v4 config for class-based dark mode; dark prose styles in `novel-preview`
- Known note: npm audit flags SheetJS advisory (prototype pollution in parsing untrusted sheets) — acceptable here since it parses your own local files; patched builds only distributed via SheetJS CDN

---

## Step 6: DOCX Editing, Sidebar Toggle, Open Folder & Bug Fixes
> **Status:** Complete

### Tasks
- [x] Fix DOCX file viewing (mammoth import path fix)
- [x] Add DOCX editing support (plain text mode with save-back)
- [x] Fix SetupDialog cancel button functionality
- [x] Add "Set Folder" button to reopen setup dialog
- [x] Add "Open Folder" feature to open working directory in system file explorer
- [x] Add sidebar minimize toggle via "Novel Editor" header button
- [x] Persist sidebar state across sessions

### Changes Log

#### DOCX Viewing Fix
- `src/components/DocxViewer.tsx`: Fixed mammoth import from `mammoth/mammoth.browser` (invalid path) to `mammoth` (Vite handles browser field resolution automatically)

#### DOCX Editing Support
- Added `docx` npm package (~500KB) for creating .docx files programmatically
- `server/index.mjs`: Added `writeDocxSafe()` function that creates minimal .docx files using the `docx` package (paragraphs with Times New Roman 12pt)
- `server/index.mjs`: Added `POST /api/file/docx` endpoint for writing DOCX files
- `src/api.ts`: Added `writeDocx()` and `openFolder()` API methods
- `src/store.ts`: Added `docxText` and `savedDocxText` state for tracking extracted text separately from base64 content
- `src/store.ts`: `openFile()` now extracts raw text from DOCX via mammoth for editing
- `src/store.ts`: `setDocxText()` action with auto-save support
- `src/store.ts`: `saveFile()` now routes DOCX saves through `api.writeDocx()` instead of `api.writeFile()`
- `src/components/EditorCanvas.tsx`: DOCX files now show editable textarea with extracted text + optional preview, instead of read-only viewer
- Banner indicates "Editing as plain text — save writes back to .docx"

#### SetupDialog Cancel Button Fix
- `src/App.tsx`: Added `setupDismissed` state to track when user cancels setup
- `SetupDialog.onClose` now sets `setupDismissed = true` instead of no-op
- Dialog only shown when `!configured && !setupDismissed`

#### Set Folder Button
- Header shows "Set Folder" button when `!configured && setupDismissed`
- Clicking reopens the setup dialog to configure a working directory

#### Open Folder Feature
- `server/index.mjs`: Added `POST /api/open-folder` endpoint
- Uses `xdg-open` (Linux/ChromeOS), `open` (macOS), or `explorer` (Windows) via `child_process.exec`
- Zero additional storage cost (uses existing Node.js built-in modules)
- `src/App.tsx`: Added folder icon button in header (visible when configured)
- `src/api.ts`: Added `openFolder()` method

#### Sidebar Minimize Toggle
- `src/store.ts`: Added `sidebarOpen` state (default `true`) with `toggleSidebar()` action
- `src/store.ts`: `sidebarOpen` persisted in localStorage via zustand persist middleware
- `src/App.tsx`: "Novel Editor" header text is now a clickable button with chevron indicator
- `src/App.tsx`: `ChapterList` only rendered when `sidebarOpen` is true
- Chevron rotates based on sidebar state (down = open, left = collapsed)

### Bundle Size Impact
| Item | Size |
|------|------|
| `docx` npm package | ~500 KB |
| New backend code | ~2 KB |
| New frontend code | ~5 KB |
| **Total addition** | **~507 KB** |

### Platform Support
- **ChromeOS (primary):** `xdg-open` for folder opening, all features work
- **Linux:** Full support including folder opening
- **macOS:** Folder opening uses `open` command
- **Windows:** Folder opening uses `explorer` command

### Bug Fixes (Post-Step 6)

#### DOCX Text Extraction Fix
- **Issue:** DOCX files showed empty content — `mammoth.extractRawText()` was silently failing
- **Root cause:** Dynamic `import('mammoth')` in the browser was unreliable; the catch block swallowed errors
- **Fix:** Changed to top-level `import mammoth from 'mammoth'` (Vite resolves browser field automatically)
- Added explicit `atob()` decode with manual byte-by-byte conversion (more robust than `Uint8Array.from`)
- Added `console.error` logging in catch block for debugging

#### DOCX Preview Simplification
- **Issue:** DOCX preview panel could fail after save-reopen cycle (reconstructed DOCX from plain text)
- **Fix:** Removed preview pane from DOCX editor — shows only the editable text area
- Added helpful error messages in `DocxViewer.tsx` for edge cases

#### Set Folder Button Fix
- **Issue:** "Set Folder" was conditional and didn't open a file manager
- **Fix:** "Set Folder" now always visible in header, clicking it opens the setup dialog
- `SetupDialog` now includes a folder icon button that opens the system file manager (`xdg-open`)
- Pre-fills input with current working directory when changing folders
- `POST /api/open-folder` now accepts optional `{path}` parameter to open any directory

### Round 2 Fixes

#### Cancel Button Fix
- **Issue:** Cancel button couldn't dismiss the dialog on first launch (when `configured` is false)
- **Root cause:** Dialog condition `{(!configured || showSetup)}` meant it always showed when not configured
- **Fix:** Added `setupDismissed` state — Cancel sets it to true, "Set Folder" resets it to false
- Dialog now respects both `configured` and `setupDismissed` states

#### Open Folder Button Fix
- **Issue:** Open folder button did nothing when clicked
- **Root cause:** Backend `readBody` hung waiting for body data on POST requests with no body; frontend sent no body when path was empty
- **Fix:** Backend `readBody` now checks `Content-Type` header and resolves immediately for non-JSON requests
- Frontend `api.openFolder()` now always sends a JSON body (`{ path: '' }`)

#### DOCX Viewer — Replaced mammoth with docx-preview
- **Issue:** mammoth-based rendering showed empty content for all DOCX files
- **Fix:** Replaced with `docx-preview` library (~75KB) which renders DOCX files with full formatting (bold, italic, tables, images, headings) — similar to WPS Office viewer
- `DocxViewer.tsx`: Uses `renderAsync()` to render DOCX buffer directly into a DOM container
- Added `docx-container` CSS styles for proper document formatting (fonts, tables, headings, dark mode)
- DOCX editor now shows editable text area alongside formatted preview (toggleable)

---

## Project Status: ALL STEPS COMPLETE + POST-LAUNCH FIXES APPLIED
