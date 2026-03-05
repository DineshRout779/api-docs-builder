# API Docs Builder

A production-ready TypeScript + React + Tailwind app for building beautiful API documentation with live preview, dark mode, and export features.

## Stack

- **React 18** + **TypeScript**
- **Tailwind CSS v3** (dark mode via `.dark` class)
- **shadcn-style** custom UI components (Button, Input, Textarea, Select, Badge, Label, Tooltip, Separator)
- **Lucide React** icons
- **Vite** for blazing fast dev/build

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```

## Features

| Feature | Details |
|---------|---------|
| **Live Preview** | Split-pane editor + real-time rich preview |
| **Rich View** | Fully rendered doc with tables, code blocks, method badges |
| **Markdown Source** | Toggle to see raw markdown |
| **cURL View** | Auto-generated cURL from your inputs |
| **Copy Doc** | One-click copy of markdown to clipboard (paste into Google Docs) |
| **Download .md** | Export clean `.md` file per endpoint |
| **Light / Dark Mode** | System-aware + persisted to localStorage |
| **Multiple Endpoints** | Tab-based multi-endpoint session |
| **TypeScript** | Full type safety across all components |
| **HTTP Methods** | GET, POST, PUT, PATCH, DELETE |
| **Status Badges** | Stable, Beta, Deprecated, Internal |
| **Headers Builder** | Key/value with required flags |
| **Parameters** | Name, type, location (query/body/path/header), required, default, description |
| **Request Body** | JSON or form-data, with content-type badge |
| **Response Example** | With status code display |
| **Error Codes** | Code + description rows |
| **Deprecation** | Mark endpoint deprecated with custom message |
| **Tags & Versioning** | Tag + version metadata per endpoint |
| **Notes** | Free-form notes field |
| **Hover-to-Copy** | Code blocks have hover copy buttons |

## Project Structure

```
src/
├── types/index.ts           # All TypeScript types
├── lib/utils.ts             # cn(), uid(), generators, color maps
├── hooks/useTheme.ts        # Dark mode hook
├── components/
│   ├── ui/                  # shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   └── tooltip.tsx
│   ├── EndpointEditor.tsx   # Left-pane form editor
│   ├── Preview.tsx          # Right-pane rich/markdown/curl preview
│   ├── FormField.tsx        # Labeled field wrapper
│   └── SectionHeader.tsx    # Section header with Add button
├── App.tsx                  # Root layout, tabs, topbar
├── main.tsx
└── index.css               # Tailwind + CSS variables (light/dark)
```
