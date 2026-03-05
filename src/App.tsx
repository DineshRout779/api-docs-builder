import { useState, useCallback, useEffect } from 'react';
import { ApiEndpoint, PreviewMode } from './types';
import {
  defaultEndpoint,
  uid,
  generateMarkdown,
  generateDocx,
} from './lib/utils';
import { useTheme } from './hooks/useTheme';
import { EndpointEditor } from './components/EndpointEditor';
import { Preview } from './components/Preview';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tooltip } from './components/ui/tooltip';
import { Input } from './components/ui/input';
import {
  Sun,
  Moon,
  Plus,
  X,
  Download,
  Copy,
  Check,
  Eye,
  Code2,
  Terminal,
  Braces,
  Search,
  Upload,
  FileJson,
} from 'lucide-react';
import { cn } from './lib/utils';

const STORAGE_KEY = 'api-docs-builder-endpoints';
const ACTIVE_ID_KEY = 'api-docs-builder-active-id';

export default function App() {
  const { theme, toggle } = useTheme();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [defaultEndpoint()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_ID_KEY);
    return saved || endpoints[0].id;
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('rich');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
  }, [endpoints]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  const active = endpoints.find((e) => e.id === activeId)!;
  const exportBaseName = (active.name || 'api-endpoint')
    .replace(/\s+/g, '-')
    .toLowerCase();

  const updateActive = useCallback(
    (patch: Partial<ApiEndpoint>) => {
      setEndpoints((prev) =>
        prev.map((e) => (e.id === activeId ? { ...e, ...patch } : e)),
      );
    },
    [activeId],
  );

  const addEndpoint = () => {
    const ep = { ...defaultEndpoint(), id: uid() };
    setEndpoints((prev) => [...prev, ep]);
    setActiveId(ep.id);
  };

  const removeEndpoint = (id: string) => {
    if (endpoints.length === 1) return;
    const remaining = endpoints.filter((e) => e.id !== id);
    setEndpoints(remaining);
    if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
  };

  const copyDoc = () => {
    navigator.clipboard.writeText(generateMarkdown(active));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMd = () => {
    const blob = new Blob([generateMarkdown(active)], {
      type: 'text/markdown',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportBaseName}.md`;
    a.click();
  };

  const downloadDocx = async () => {
    const blob = await generateDocx(active);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportBaseName}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportProject = () => {
    const data = JSON.stringify(endpoints, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-docs-project-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (Array.isArray(imported)) {
          if (
            confirm('Importing will replace your current endpoints. Continue?')
          ) {
            setEndpoints(imported);
            setActiveId(imported[0].id);
          }
        }
      } catch (err) {
        alert('Failed to import project: Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const previewTabs: {
    id: PreviewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'rich', label: 'Rich View', icon: <Eye size={13} /> },
    { id: 'markdown', label: 'Markdown', icon: <Code2 size={13} /> },
    { id: 'curl', label: 'cURL', icon: <Terminal size={13} /> },
  ];

  return (
    <div className='flex flex-col h-screen bg-background text-foreground overflow-hidden'>
      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <header className='flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm z-20 shrink-0'>
        {/* Logo */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <div className='w-7 h-7 rounded-lg bg-primary flex items-center justify-center'>
              <Braces size={14} className='text-white' />
            </div>
            <span className='font-display text-base font-bold text-foreground tracking-tight'>
              API <span className='text-primary'>Docs</span>
            </span>
          </div>

          {/* Endpoint tabs */}
          <div className='flex items-center gap-1 ml-2 overflow-x-auto max-w-[500px]'>
            {endpoints
              .filter((ep) => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                  ep.name.toLowerCase().includes(search) ||
                  ep.path.toLowerCase().includes(search) ||
                  ep.method.toLowerCase().includes(search)
                );
              })
              .map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveId(ep.id)}
                  className={cn(
                    'group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border',
                    activeId === ep.id
                      ? 'bg-secondary border-border text-foreground shadow-sm'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      ep.method === 'GET'
                        ? 'bg-emerald-500'
                        : ep.method === 'POST'
                          ? 'bg-blue-500'
                          : ep.method === 'PUT'
                            ? 'bg-amber-500'
                            : ep.method === 'PATCH'
                              ? 'bg-violet-500'
                              : 'bg-red-500',
                    )}
                  />
                  <span className='max-w-[120px] truncate'>
                    {ep.name || 'Untitled API'}
                  </span>
                  {endpoints.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEndpoint(ep.id);
                      }}
                      className='opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all ml-0.5'
                    >
                      <X size={10} />
                    </span>
                  )}
                </button>
              ))}
            <Tooltip content='Add endpoint'>
              <Button
                variant='ghost'
                size='icon'
                onClick={addEndpoint}
                className='h-7 w-7 shrink-0 text-muted-foreground hover:text-primary'
              >
                <Plus size={14} />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          <div className='relative group mr-2'>
            <Search
              className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
              size={14}
            />
            <Input
              placeholder='Search endpoints...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 h-8 w-[200px] text-xs bg-secondary/30 border-transparent focus:bg-background transition-all'
            />
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={copyDoc}
            className={cn(
              'gap-1.5',
              copied &&
                'text-emerald-600 border-emerald-300 dark:border-emerald-800',
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy Doc'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={downloadMd}
            className='gap-1.5'
          >
            <Download size={13} />
            .md
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={downloadDocx}
            className='gap-1.5'
          >
            <Download size={13} />
            .docx
          </Button>
          <div className='w-px h-5 bg-border mx-1' />
          <div className='flex items-center gap-1'>
            <Tooltip content='Export Project (.json)'>
              <Button
                variant='ghost'
                size='icon'
                onClick={exportProject}
                className='text-muted-foreground hover:text-foreground'
              >
                <FileJson size={15} />
              </Button>
            </Tooltip>
            <Tooltip content='Import Project (.json)'>
              <label className='cursor-pointer'>
                <div className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground'>
                  <Upload size={15} />
                </div>
                <input
                  type='file'
                  accept='.json'
                  onChange={importProject}
                  className='hidden'
                />
              </label>
            </Tooltip>
          </div>
          <div className='w-px h-5 bg-border mx-1' />
          <Tooltip
            content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <Button
              variant='ghost'
              size='icon'
              onClick={toggle}
              className='text-muted-foreground hover:text-foreground'
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* ── MAIN SPLIT ─────────────────────────────────────────── */}
      <div className='flex flex-1 overflow-hidden'>
        {/* LEFT: Editor */}
        <div className='w-[46%] border-r border-border overflow-y-auto shrink-0'>
          <EndpointEditor endpoint={active} onChange={updateActive} />
        </div>

        {/* RIGHT: Preview */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Preview mode tabs */}
          <div className='flex items-center gap-1 px-4 py-2 border-b border-border bg-card/30 shrink-0'>
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2'>
              Preview
            </span>
            {previewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPreviewMode(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  previewMode === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Preview content */}
          <div className='flex-1 overflow-y-auto'>
            <Preview endpoint={active} mode={previewMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
