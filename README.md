# PDF Tormentosa

A minimalist PDF reader built with Tauri 2, React 19, TypeScript, Tailwind CSS 4 and pdf.js.

## Development

```sh
pnpm install
pnpm tauri dev
```

## Architecture

```
src/
├── app/                 # Shell: composes modules, app menus and shortcuts
├── modules/
│   ├── menu/            # Generic menu bar (MenuBar → Menu → MenuItem)
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
