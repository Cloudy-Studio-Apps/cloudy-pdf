# Cloudy PDF

A minimalist PDF reader built with Tauri 2, React 19, TypeScript, Tailwind CSS 4 and pdf.js.

## Development

```sh
pnpm install
pnpm tauri dev
```

## Release builds

| Command | Builds | Output |
| --- | --- | --- |
| `pnpm release:linux` | The `.deb`, `.rpm` and AppImage | `src-tauri/target/release/bundle/` |
| `pnpm release:arch` | A pacman package with the desktop entry | `packaging/arch/` |
| `pnpm release` | Both | |

Install the Arch package with `sudo pacman -U packaging/arch/cloudy-pdf-*.pkg.tar.zst`.

### Publishing a release

Releases are built by GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)) when a version tag is pushed:

```sh
pnpm release:tag 0.2.0   # writes the version, commits "Release v0.2.0", tags v0.2.0 and pushes
```

The workflow builds the Windows installer, the `.deb`, the `.rpm`, the AppImage and the Arch package into a **draft** release. Review the notes and press **Publish**.

## Architecture

```
src/
├── app/                 # Shell: composes modules, app menus, shortcuts, tab → page mapping
├── modules/
│   ├── tabs/            # Tab state (pure utils + useTabs), TabBar, TabPanel
│   ├── home/            # Home tab: welcome section + Recent files table
│   ├── history/         # Recent files (pure utils, store-plugin persistence, useHistory)
│   ├── tools/           # Tools tab page (fixed)
│   ├── menu/            # Generic menus: menu bar, right-click ContextMenu, shared MenuList
│   ├── system/          # OS hand-offs: show in file manager, "Open with…" 
│   ├── document/        # Picking and reading files through Tauri
│   ├── pdf/             # pdf.js wrapper (load, page sizes, render)
│   ├── viewer/          # Continuous-scroll viewer, zoom, page navigation
│   └── about/           # About dialog with the app name and version
├── shared/
│   ├── ui/              # Reusable primitives (Button, IconButton, Dialog)
│   ├── hooks/           # Generic DOM hooks (in view, element width, click outside)
│   ├── keyboard/        # Shortcut matching, formatting and binding
│   └── utils/           # Pure helpers
└── styles/              # Tailwind entry and design tokens
```

Conventions:

- Each module keeps its types in `<module>.types.ts` and its constants in `<module>.constants.ts`.
- Side effects (Tauri, pdf.js) live in `services/`, and React state lives in `hooks/`.
- Components only compose hooks and render markup.

## Recent files

Every opened PDF is recorded in `history.json` (Tauri store plugin, app data folder) with its
name, path, size and last-opened time; only metadata, never the file itself. The list keeps the
20 most recent files, newest first.

Reopening from Recent works after a restart because `tauri-plugin-persisted-scope` remembers which
files were granted read access. If a file was moved or deleted, opening it shows an error on Home;
remove it from the list with the × on its row.

Right-click (or press and hold on touch screens) a recent file for: **Open**, **Show in file manager**, **Open with…** and
**Remove from history**. On Linux, "Show in file manager" uses the `FileManager1` D-Bus interface
(via `tauri-plugin-opener`) and "Open with…" uses the XDG Desktop Portal app chooser
(`src-tauri/src/open_with.rs`), so the dialog is the desktop's own. Both are desktop-only.

## Tabs

Home and Tools are fixed tabs. Every opened PDF gets its own closable tab; opening a file
that's already open focuses its tab. Inactive tabs stay mounted (hidden), so each keeps
its scroll position and zoom.

| Shortcut | Action |
| --- | --- |
| Ctrl+O | Open a PDF in a new tab |
| Ctrl+W / middle-click | Close the current / clicked document tab |
| Ctrl+Tab, Ctrl+Shift+Tab | Next / previous tab |
| Ctrl+=, Ctrl+−, Ctrl+0 | Zoom in / out / fit width |
| Ctrl + mouse wheel / touchpad pinch | Zoom in / out around the pointer |

## Default PDF reader

The app registers itself as a handler for `application/pdf`:

- **Linux:** the `.deb` / `.rpm` packages install a `.desktop` file (template in `src-tauri/linux/`)
  with `MimeType=application/pdf` and `Exec=… %F`. Set it as the default app with
  `xdg-mime default "Cloudy PDF.desktop" application/pdf` or from your desktop's settings.
  If the app is already running, opening another PDF reuses that window (single-instance plugin).
- **Android:** `bundle.fileAssociations` adds an `ACTION_VIEW` intent filter for `application/pdf`,
  so the app shows up in "Open with…". Files arrive as `content://` URIs.

Flow: the OS hands over a file → `src-tauri/src/opened_files.rs` queues it and emits
`opened-files://pending` → the frontend drains the queue (`useOpenedFiles`) and opens the latest file.

## License

Copyright © 2026 DarkRedgm.

Cloudy PDF is free software, licensed under the [GNU Affero General Public License v3.0](LICENSE). You may use, study, change and share it. If you distribute a modified version, or run one as a service others use over a network, you must publish its source under the same license.

### Third-party content

- PDF rendering by [pdf.js](https://mozilla.github.io/pdf.js/), © Mozilla and contributors, licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- Icons from [Lucide](https://lucide.dev) (ISC), via `react-icons`.
- Other dependencies keep their own licenses, listed in `package.json` and `src-tauri/Cargo.toml`.
