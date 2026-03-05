import type { HttpMethod } from '@/types';
import { cn } from '@/lib/utils';

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET:    'method-get',
  POST:   'method-post',
  PUT:    'method-put',
  PATCH:  'method-patch',
  DELETE: 'method-delete',
};

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'sm' | 'md' | 'lg';
}

export function MethodBadge({ method, size = 'md' }: MethodBadgeProps) {
  const sizeClass = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span className={cn(
      'inline-flex items-center font-mono font-bold rounded border tracking-wider',
      METHOD_CLASS[method],
      sizeClass
    )}>
      {method}
    </span>
  );
}
