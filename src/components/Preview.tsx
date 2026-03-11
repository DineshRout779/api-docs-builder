import { useState } from 'react';
import { ApiEndpoint, EnvironmentType } from '@/types';
import {
  METHOD_COLORS,
  STATUS_COLORS,
  generateMarkdown,
  generateCurl,
} from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  endpoint: ApiEndpoint;
  mode: 'rich' | 'markdown' | 'curl';
}

function CopyButton({
  text,
  label = 'Copy',
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={handleCopy}
      className={cn('gap-1.5 text-xs', copied && 'text-emerald-500')}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}

function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <div
      className={cn(
        'relative group rounded-lg border border-border overflow-hidden',
        className,
      )}
    >
      <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10'>
        <CopyButton text={code} />
      </div>
      <pre className='bg-muted/40 p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre-wrap'>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pt-1'>
      {children}
    </h3>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className='rounded-lg border border-border overflow-hidden'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-muted/50 border-b border-border'>
            {headers.map((h) => (
              <th
                key={h}
                className='text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className='border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors'
            >
              {row.map((cell, j) => (
                <td key={j} className='px-3 py-2.5 text-sm'>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RichPreview({ ep }: { ep: ApiEndpoint }) {
  const environments: EnvironmentType[] = ['Staging', 'UAT', 'Production'];
  const qParams = ep.params.filter((p) => p.location === 'query');
  const bodyParams = ep.params.filter((p) => p.location === 'body');
  const pathParams = ep.params.filter((p) => p.location === 'path');
  const headerParams = ep.params.filter((p) => p.location === 'header');
  const decryptedParams = ep.params.filter((p) => p.location === 'decrypted');

  const paramSection = (title: string, params: typeof ep.params) =>
    params.length > 0 && (
      <div>
        <SectionTitle>{title}</SectionTitle>
        <Table
          headers={['Name', 'Type', 'Required', 'Default', 'Description']}
          rows={params.map((p) => [
            <code className='text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded'>
              {p.name}
            </code>,
            <code className='text-xs font-mono text-amber-600 dark:text-amber-400'>
              {p.type}
            </code>,
            p.required ? (
              <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                Yes
              </span>
            ) : (
              <span className='text-xs text-muted-foreground'>—</span>
            ),
            p.defaultValue ? (
              <code className='text-xs font-mono text-muted-foreground'>
                {p.defaultValue}
              </code>
            ) : (
              <span className='text-muted-foreground'>—</span>
            ),
            <span className='text-muted-foreground text-xs'>
              {p.description}
            </span>,
          ])}
        />
      </div>
    );

  return (
    <div className='p-6 max-w-none space-y-6'>
      {/* Header */}
      <div>
        <div className='flex items-center gap-3 mb-3 flex-wrap'>
          <h1 className='font-display text-2xl font-bold text-foreground'>
            {ep.name}
          </h1>
        </div>

        {ep.deprecated && (
          <div className='flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-3'>
            <AlertTriangle
              size={14}
              className='text-amber-500 mt-0.5 shrink-0'
            />
            <p className='text-sm text-amber-700 dark:text-amber-400'>
              <strong>Deprecated.</strong>{' '}
              {ep.deprecatedMessage || 'This endpoint is deprecated.'}
            </p>
          </div>
        )}

        <div className='space-y-2'>
          {environments.map((env) => {
            const cfg = ep.environments[env];
            return (
              <div
                key={env}
                className='inline-flex items-center rounded-xl border border-border overflow-hidden shadow-sm mr-2'
              >
                <span
                  className={cn(
                    'px-3 py-2 text-xs font-bold border-r border-border',
                    STATUS_COLORS[env],
                  )}
                >
                  {env}
                </span>
                <span
                  className={cn(
                    'px-3 py-2 text-xs font-bold font-mono tracking-widest border-r border-border',
                    METHOD_COLORS[ep.method],
                  )}
                >
                  {ep.method}
                </span>
                <div className='px-4 py-2 font-mono text-sm bg-secondary/40'>
                  <span className='text-muted-foreground'>{cfg.baseUrl}</span>
                  <span className='text-foreground font-medium'>{ep.path}</span>
                </div>
                <span className='px-3 py-2 text-[11px] text-muted-foreground bg-secondary border-l border-border'>
                  {cfg.apiType === 'auth' ? 'Auth' : 'No Auth'}
                </span>
              </div>
            );
          })}
        </div>

        {ep.description && (
          <p className='mt-3 text-muted-foreground text-sm leading-relaxed'>
            {ep.description}
          </p>
        )}
      </div>

      <div className='h-px bg-border' />

      {/* Headers */}
      {ep.headers.length > 0 && (
        <div>
          <SectionTitle>Request Headers</SectionTitle>
          <Table
            headers={['Header', 'Value', 'Required', 'Description']}
            rows={ep.headers.map((h) => [
              <code className='text-xs font-mono text-violet-600 dark:text-violet-400'>
                {h.key}
              </code>,
              <code className='text-xs font-mono text-muted-foreground'>
                {h.value}
              </code>,
              h.required ? (
                <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                  Yes
                </span>
              ) : (
                <span className='text-xs text-muted-foreground'>—</span>
              ),
              <span className='text-muted-foreground text-xs'>
                {h.description}
              </span>,
            ])}
          />
        </div>
      )}

      {paramSection('Path Parameters', pathParams)}
      {paramSection('Query Parameters', qParams)}
      {paramSection('Body Parameters', bodyParams)}
      {paramSection('Header Parameters', headerParams)}

      {/* Request Body */}
      {ep.requestBody && ep.requestBodyType !== 'none' && (
        <div>
          <SectionTitle>Request Body</SectionTitle>
          <div className='flex items-center gap-2 mb-2'>
            <Badge className='border-border text-muted-foreground bg-secondary text-xs'>
              {ep.requestBodyType === 'json'
                ? 'application/json'
                : 'multipart/form-data'}
            </Badge>
          </div>
          <CodeBlock code={ep.requestBody} />
        </div>
      )}

      {ep.isEncrypted &&
        (ep.decryptedRequestBody || decryptedParams.length > 0) && (
          <div className='space-y-4'>
            <SectionTitle>Decrypted Request Information</SectionTitle>
            {ep.decryptedRequestBody && (
              <div className='space-y-2'>
                <span className='text-[10px] text-muted-foreground uppercase tracking-widest font-medium'>
                  Decrypted Body Example
                </span>
                <CodeBlock code={ep.decryptedRequestBody} />
              </div>
            )}
            {decryptedParams.length > 0 &&
              paramSection('Decrypted Fields', decryptedParams)}
          </div>
        )}

      {/* Response */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <SectionTitle>Response</SectionTitle>
          <Badge className='border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/40 text-xs -mt-1'>
            {ep.responseStatusCode}
          </Badge>
        </div>
        <CodeBlock code={ep.responseExample} />
      </div>

      {/* cURL */}
      <div>
        <SectionTitle>cURL Example</SectionTitle>
        <CodeBlock code={generateCurl(ep)} />
      </div>

      {/* Errors */}
      {ep.errorCodes.length > 0 && (
        <div>
          <SectionTitle>Error Codes</SectionTitle>
          <Table
            headers={['Status Code', 'Description']}
            rows={ep.errorCodes.map((e) => [
              <code className='text-xs font-mono text-red-500 dark:text-red-400 font-semibold'>
                {e.code}
              </code>,
              <span className='text-muted-foreground text-xs'>
                {e.description}
              </span>,
            ])}
          />
        </div>
      )}

      {/* Notes */}
      {ep.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <div className='rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed'>
            {ep.notes}
          </div>
        </div>
      )}
    </div>
  );
}

export function Preview({ endpoint, mode }: PreviewProps) {
  if (mode === 'rich') return <RichPreview ep={endpoint} />;

  const content =
    mode === 'markdown' ? generateMarkdown(endpoint) : generateCurl(endpoint);

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-3'>
        <span className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
          {mode === 'markdown' ? 'Markdown Source' : 'cURL Command'}
        </span>
        <CopyButton
          text={content}
          label={`Copy ${mode === 'markdown' ? 'Markdown' : 'cURL'}`}
        />
      </div>
      <pre className='bg-muted/30 border border-border rounded-xl p-5 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre-wrap'>
        {content}
      </pre>
    </div>
  );
}
