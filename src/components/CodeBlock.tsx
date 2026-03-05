import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  lang?: string;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({ code, lang = 'json', className, maxHeight = '320px' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative group rounded-lg border bg-muted/40 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          {lang}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre
        className="overflow-auto p-4 text-[12px] font-mono leading-relaxed text-foreground/80"
        style={{ maxHeight }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
