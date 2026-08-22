# Light Novel Markdown Editor — Installation & Deployment Guide

A real-time Markdown editor PWA for writing novels, with native Git sync over SSH,
a Table of Contents, live preview, dark mode, and read-only viewers for `.docx`,
`.xlsx` / `.xls`, `.txt` / `.csv` files.

**Architecture:** React frontend (Vite build) + one dependency-free Node.js backend
(`server/index.mjs`, pure built-in modules) that shells out to your system `git`
using your existing SSH keys. No tokens, no passwords.

---

## 1. Storage Expectations

| Item | Size | Installed on target? |
|------|------|----------------------|
| App source code | ~104 KB | Yes |
| Built app (`dist/`) | ~1.3 MB | Yes |
| Runtime npm packages | **0 MB** (server uses only Node built-ins) | No |
| Dev `node_modules` (vite/react/tsc…) | ~135 MB | Never — dev machine only |
| Node.js runtime (one-time, shared system-wide) | ~110 MB | Yes |

- **Chromebook total ≈ 112 MB**, dominated by Node.js itself; the app adds ~1.4 MB.
- The 135 MB+ you may see in the project folder on your PC is `node_modules` —
  it never gets deployed or shipped anywhere.
- The browser caches ~2–4 MB for offline PWA use after first load.

---

## 2. Part A — Setup on Windows (development machine)

Requires Node.js 18+ (`node --version`).

```powershell
cd E:\Project\noveleditor\light-novel-editor
npm install          # one-time (~135 MB node_modules)
npm run dev          # dev mode → http://localhost:5173 (backend :3001)
```

Production mode (build + single server):

```powershell
npm start            # builds then serves app + API together on http://localhost:3001
```

First launch: enter the absolute path to your novel folder in the setup dialog,
e.g. `C:\Users\nithe\OneDrive\Desktop\Legacy of the Lost Earth`.

---

## 3. Part B — Publish the editor code to GitHub

From `light-novel-editor/`:

```bash
git init
git add -A
git commit -m "Novel editor"
gh repo create novel-editor --private --source=. --push
# or manually:
#   git remote add origin git@github.com:<USER>/novel-editor.git
#   git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist`, and logs.

---

## 4. Part C — Deploy on the Chromebook (Linux / Crostini)

### 4.1 Prerequisites

Linux must be enabled (Settings → Advanced → Developers → Linux development
environment). Your SSH keys are already configured there.

### 4.2 Install Node.js (one-time, ~110 MB)

```bash
sudo apt update && sudo apt install -y curl git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
exec bash
nvm install 22
node --version   # verify
```

### 4.3 Get the code

```bash
cd ~
git clone git@github.com:NitheeshPrahalath/novel-editor.git
cd novel-editor
```

### 4.4 Run — pick ONE option

**Option 1 — standard (~112 MB total):**

```bash
npm install       # one-time, includes dev tools used to build
npm start         # builds the frontend, then serves everything on :3001
rm -rf node_modules   # optional cleanup after building (~135 MB back)
```

**Option 2 — zero-install (leanest):**

Build once on Windows (`npm run build`), remove `dist` from `.gitignore`,
and push it along with the code. Then on the Chromebook **no npm install is
needed at all**:

```bash
node server/index.mjs    # serves the pre-built app on http://localhost:3001
```

### 4.5 Keep it running after closing the terminal

```bash
nohup node server/index.mjs > ~/novel-editor.log 2>&1 &
```

---

## 5. Connect Your Novel Folder

OneDrive is not visible from Crostini — clone your novel repository natively
into the Linux filesystem instead (your SSH key handles auth automatically):

```bash
cd ~
git clone git@github.com:NitheeshPrahalath/Legacy-of-Lost-Earth.git
```

Then open the app (`http://localhost:3001`) and enter this path in the setup
dialog:

```
/home/<your-linux-username>/Legacy-of-Lost-Earth
```

Committing works exactly like on desktop: type a message in **Git Sync** →
**Commit & Push**. New files are staged automatically (`git add -A` runs under
the hood) — manual `git add` is never required.

## 6. Install as a Chromebook App (PWA)

1. Open `http://localhost:3001` in Chrome.
2. Menu (⋮) → *Cast, save, and share* → *Install page as app*.
3. It now launches standalone from the launcher with offline caching.

---

## 7. Daily Usage Cheat Sheet

| Action | How |
|--------|-----|
| Write | Select chapter in left sidebar; edits auto-save after 1 s |
| Navigate long chapters | TOC sidebar (right); click any heading to jump |
| Save manually | Ctrl+S |
| Focus mode | Header **Focus** button; Esc or ✕ exits |
| Dark mode | Sun/moon toggle in header |
| Sync with GitHub | Header **Git Sync** → review diff → Commit & Push |
| Pull latest | Git Sync → **Pull Latest** (file list refreshes too) |
| Refresh file list | Circular-arrow button in Chapters header (also auto-refreshes on window focus / every 15 s) |

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` / port 3001 busy | `pkill -f "server/index.mjs"` then restart |
| "Directory does not exist" in setup dialog | Use the Linux path (`/home/…`), not the Windows path; check spelling with `ls` |
| `git push` fails with permission denied | Ensure your SSH key is loaded: `ssh -T git@github.com` inside Crostini |
| Files created outside the app don't appear | Click the refresh icon in the Chapters sidebar |
| App loads but API errors | Make sure the Node server is running (`npm run serve`), not just a static host |
| Blank page after update | Hard-refresh (Ctrl+Shift+R) to bypass the old service-worker cache |

---

*See `PROGRESS.md` for the full development changelog and `Light_Novel_App_Architecture.md`
for the original design blueprint.*
