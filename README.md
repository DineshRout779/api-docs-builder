# 🚀 API Docs Builder

A professional, production-ready **TypeScript + React + Tailwind** suite designed to help developers build, preview, and export beautiful API documentation in seconds.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)

---

## ✨ Key Features

| Feature                 | Description                                                             |
| :---------------------- | :---------------------------------------------------------------------- |
| **⚡ Live Preview**     | Real-time split-pane editing with instant visual updates.               |
| **📄 Export Formats**   | Download as clean **Markdown (.md)** or high-fidelity **Word (.docx)**. |
| **🔄 Project Sync**     | Full project **Import/Export (.json)** support for backup and sharing.  |
| **💾 Auto-Persistence** | Session state and theme persisted automatically via `localStorage`.     |
| **🔍 Smart Search**     | Filter and find endpoints instantly with the integrated search bar.     |
| **📋 Clipboard Ready**  | One-click **Copy Doc** formatted for Google Docs or Notion.             |
| **🛠️ cURL Generator**   | Automatically generates valid cURL commands based on your inputs.       |
| **🌓 Dark Mode**        | System-aware theme switching with a sleek glassmorphism UI.             |
| **📑 Multi-Endpoint**   | Manage multiple API endpoints in a single tabbed session.               |

---

## 🛠️ Tech Stack

- **Core**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom Shadc-style components
- **Icons**: [Lucide React](https://lucide.dev/)
- **Primitives**: UI powered by [Radix UI](https://www.radix-ui.com/) (ScrollArea, Switch, Tabs)
- **Doc Generation**: [docx](https://docx.js.org/) for professional .docx exports
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Development

Launch the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

### 3. Production Build

Compile and optimize for production:

```bash
npm run build
```

---

## 📖 Usage Guide

### Managing Endpoints

- **Add**: Click the **(+)** icon in the sidebar/topbar to create a new endpoint.
- **Switch**: Click on any endpoint tab to switch focus.
- **Delete**: Hover over an endpoint tab and click the **(X)** to remove it.

### Exporting Your Work

- **Copy**: Use the **Copy Doc** button to copy the Markdown source to your clipboard.
- **File**: Download the current endpoint as `.md` or `.docx` using the respective buttons.
- **Suite**: Export the entire project as a `.json` file for later use or collaboration.

### Documentation Details

Fill in the editor on the left to define:

- **Methods**: GET, POST, PUT, PATCH, DELETE.
- **Status**: Stable, Beta, Deprecated, Internal.
- **Parameters**: Define name, type, location (Query/Body/Path/Header), and default values.
- **Headers**: Key-value pairs with requirement flags.
- **Response**: Example JSON responses and status codes.

---

## 📁 Project Structure

```bash
src/
├── components/          # UI Components
│   ├── ui/              # Radix + Tailwind base primitives
│   ├── EndpointEditor/  # Main form for editing API details
│   ├── Preview/         # Rich/MD/cURL preview engine
│   └── SectionHeader/   # Reusable section headers
├── hooks/               # Custom hooks (e.g., useTheme)
├── lib/                 # Utility functions (Uid, Markdown/Docx generators)
├── types/               # TypeScript interfaces & enums
├── App.tsx              # Main layout and state management
└── index.css            # Global styles and theme variables
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it as you see fit.

---

_Built with ❤️ for developers by Dinesh Rout._
