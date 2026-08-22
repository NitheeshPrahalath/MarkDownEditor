# System Architecture & Development Blueprint: Light Novel Markdown Editor PWA

This document outlines the full production architecture, tools, core features, and data-flow pipelines required to build a cross-platform Progressive Web App (PWA) optimized for Chromebooks and mobile devices. The app reads local Markdown files, renders a real-time editable preview with full heading support, provides a Table of Contents for navigation, and syncs changes to a Git repository via the system's native SSH-authenticated Git client.

---

## 1. Technical Stack & Development Tools

### Frontend & Core Engine
* **Framework:** Vite + React + TypeScript (Provides a fast, strictly-typed development pipeline and a tiny final build size).
* **Styling & Layout:** Tailwind CSS (Enables fluid UI adjustments for mobile, tablet, and wide Chromebook screens).
* **Markdown Parser:** `markdown-it` (Converts plain text into clean, accessible HTML structures natively, with full heading support H1–H6).
* **Live Editor:** `@uiw/react-md-editor` or custom CodeMirror integration (Provides a real-time split-pane editing experience with instant rendered preview).
* **State Management:** Zustand (Lightweight storage to manage active file content, TOC state, and git status without performance lag).

### Git & Sync Utilities
* **Git Engine:** Native system `git` CLI via Chromebook Linux (Crostini) SSH (No browser-based Git needed — the Chromebook already has SSH keys configured in the Linux container).
* **Git Bridge:** A lightweight local backend server (Node.js/Express) running inside Crostini that shells out to the native `git` binary for `add`, `commit`, `push`, `pull`, and `diff` operations against the user's remote repository over SSH.
* **Text Comparison:** `diff` / `jsdiff` (Calculates character/line changes between the working tree and the last committed version for visual diff display).

### App Distribution Wrappers (Optional Frameworks)
* **ChromeOS / Android / Web:** Native PWA (Zero-overhead install via Chrome browser engine).
* **Standalone Android Deployment:** Capacitor by Ionic (Wraps the web code into an official `.apk` bundle for distribution via the Google Play Store if desired).

---

## 2. System Architecture & Folder File Structure

The application operates as a dual-layer system: a React PWA frontend that handles editing and preview, and a lightweight Node.js backend inside the Chromebook's Linux (Crostini) container that bridges to the native `git` CLI over SSH. Files are read from and written to the local working directory, then committed and pushed to the remote repository using already-configured SSH credentials.

```text
light-novel-editor/
├── public/
│   ├── manifest.json          # Defines PWA installation details, app icons, and theme accent colors
│   └── sw.js                  # Service Worker managing full offline caching and asset management
├── server/                    # Local Node.js backend running inside Chromebook Linux (Crostini)
│   ├── gitBridge.ts           # Shells out to native git CLI (add, commit, push, pull, diff, status)
│   └── fileBridge.ts          # Reads/writes .md files from the local working directory
├── src/
│   ├── assets/                # Local app icons and typography font files
│   ├── components/
│   │   ├── ChapterList.tsx    # Left sidebar component listing .md files in the working directory
│   │   ├── DiffViewer.tsx     # Visual side-by-side or inline commit comparison panel
│   │   ├── EditorCanvas.tsx   # Central real-time editable markdown viewport with live preview
│   │   ├── TableOfContents.tsx # Right sidebar TOC auto-generated from H1–H6 headings for navigation
│   │   └── SyncPanel.tsx      # Git commit message input, push, pull, and status display
│   ├── hooks/
│   │   ├── useFileSystem.ts   # Fetches and saves .md file content via the backend file bridge
│   │   └── useGitEngine.ts    # Calls backend git bridge endpoints (commit, push, pull, diff)
│   ├── utils/
│   │   ├── novelFormatter.ts  # Text processing for indents, word counts, and typesetting rules
│   │   └── tocGenerator.ts    # Parses markdown headings to build TOC tree structure
│   ├── App.tsx                # Primary structural layout coordinator
│   └── main.tsx               # Application entry point
```

### Data Flow Diagram

```text
┌─────────────────────────────────────────────────────┐
│  PWA Frontend (React)                                │
│                                                       │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Chapter  │  │ Editor     │  │ Table of         │  │
│  │ List     │  │ Canvas     │  │ Contents         │  │
│  │ (files)  │  │ (live edit │  │ (H1–H6 nav)      │  │
│  │          │  │ + preview) │  │                  │  │
│  └────┬─────┘  └─────┬──────┘  └────────┬─────────┘  │
│       │              │                   │            │
│       ▼              ▼                   ▼            │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Zustand Store (active file, TOC, git status)    │ │
│  └──────────────────────┬──────────────────────────┘ │
│                         │                              │
│  ┌──────────────────────▼──────────────────────────┐ │
│  │  SyncPanel (commit message, push/pull buttons)  │ │
│  └──────────────────────┬──────────────────────────┘ │
└─────────────────────────┼───────────────────────────┘
                          │ HTTP (localhost)
                          ▼
┌─────────────────────────────────────────────────────┐
│  Local Backend (Node.js inside Crostini Linux)       │
│                                                       │
│  fileBridge.ts            gitBridge.ts               │
│  ├─ read .md files        ├─ git add <file>          │
│  └─ write .md files       ├─ git commit -m "msg"     │
│                           ├─ git push origin <branch>│
│                           ├─ git pull origin <branch>│
│                           └─ git diff (for DiffViewer)│
│                                  │                   │
│                                  ▼                   │
│                        Native SSH ↔ Remote Repo      │
└─────────────────────────────────────────────────────┘
```

---

## 3. Mandatory & Requested Features

### Feature A: Real-Time Editable Markdown View
* **Live Split-Pane Editor:** The central canvas shows a writable text editor on one side and an instantly rendered HTML preview on the other. Every keystroke updates the preview in real time.
* **Full Heading Support:** All Markdown headings (H1 through H6) are parsed, styled, and rendered with distinct visual hierarchy. Headings are also used as structural anchors for the Table of Contents.
* **Universal Paragraph Indentation:** Automatically applies standard novel spacing to paragraph openings via CSS, keeping raw text files perfectly clean.
* **Typographic Customization:** Users can switch between clean Sans-Serif and serif fonts, adjusting text sizing and line heights for a highly readable layout.
* **Distraction-Free Environment:** Toggleable full-screen mode completely hides all toolbars and navigation panes, allowing you to focus entirely on writing.

### Feature B: Table of Contents (TOC) Navigation
* **Auto-Generated TOC:** The right sidebar dynamically builds a Table of Contents from all H1–H6 headings in the active `.md` file. The TOC updates in real time as headings are edited, added, or removed.
* **Click-to-Navigate:** Clicking any TOC entry instantly scrolls the editor and preview pane to that heading's position.
* **Collapsible Hierarchy:** Nested headings are displayed in a collapsible tree structure, allowing users to expand or collapse sections for quick overview.

### Feature C: Native Git Push & Pull Pipeline (SSH)
* **No Command-Line Required:** The application interface provides simple visual buttons for "Pull Latest Changes" and "Commit & Push to Remote."
* **SSH-Authenticated:** The local backend shells out to the system `git` binary, which uses the SSH keys already configured in the Chromebook's Linux (Crostini) container. No tokens, passwords, or browser-based Git libraries needed.
* **Target Directory Sync:** Git operations (`add`, `commit`, `push`) execute against the local working directory the user opened, syncing directly to the configured remote repository.
* **In-Memory File Synchronization:** Files are read and written directly to the local working directory through the backend file bridge, then committed and pushed via native Git over SSH.

### Feature D: Visual Diff Engine (Line-by-Line Tracking)
* **Pre-Commit Review Panel:** Displays your local changes clearly before you sync them to the remote repository by running `git diff` through the backend.
* **Color-Coded Modifications:** Highlights text segments with green markers for added sentences and red markers for deleted paragraphs, ensuring you can review edits with absolute confidence.

---

## 4. Recommended Expansion Features (Highly Advised for Novelists)

* **Lore Database & Character Tracker:** Adds a split-screen panel to anchor character profiles, magic progression rules, and timeline notes right next to your active chapter canvas.
* **Manuscript Chapter Reordering:** A drag-and-drop structural list allowing you to easily reposition scenes or chapters without messing up your manuscript file order.
* **Automated Version Control:** Automatically saves local incremental drafts to the browser's memory (IndexedDB) every 60 seconds to protect against unsaved changes.
* **Live Session Metrics:** Displays active writing timers, word-count milestones, and daily tracking metrics directly in the lower status bar.

---

## 5. Implementation Roadmap (Step-by-Step Production Plan)

### Step 1: Initialize Project & Setup PWA Environment
1. Bootstrap the project directory using a fast, modern build pipeline:
   ```bash
   npm create vite@latest light-novel-editor -- --template react-ts
   ```
2. Configure your application manifests and service workers to ensure full offline capability and native Chromebook installation support.
3. Set up the lightweight Node.js/Express backend in `server/` to run inside Crostini Linux.

### Step 2: Build the Local File & Backend Bridge
1. Create a `fileBridge` module in the backend that reads and writes `.md` files from the local working directory on the Chromebook.
2. Expose REST endpoints (`GET /files`, `GET /file/:path`, `PUT /file/:path`) for the frontend to fetch and save file content.
3. Create a `gitBridge` module that shells out to the native `git` CLI for `status`, `add`, `commit`, `push`, `pull`, and `diff` operations.

### Step 3: Implement Real-Time Editor & Table of Contents
1. Build the `EditorCanvas` component with a live split-pane editor using `markdown-it` for instant preview rendering.
2. Ensure full H1–H6 heading support with proper styling hierarchy.
3. Build the `tocGenerator` utility to parse headings from the markdown content and build a collapsible TOC tree.
4. Implement the `TableOfContents` sidebar with click-to-scroll navigation that stays in sync as content changes.

### Step 4: Implement Git Connectivity & Visual Diff
1. Wire the `SyncPanel` component to the backend `gitBridge` endpoints for commit, push, and pull operations using the system's native SSH keys.
2. Build the `DiffViewer` component that fetches `git diff` output and renders color-coded line-by-line changes before committing.

### Step 5: Refine Layouts & Polish Mobile Deployment
1. Build a responsive, flexible layout interface that naturally fits large Chromebook laptop screens while seamlessly adapting to compact touchscreen tablet and phone sizes.
2. Package the finalized build distribution folder for standalone desktop access, or wrap your code with mobile distribution wrappers for easy installation from app stores.
