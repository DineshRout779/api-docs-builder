import { useCallback, useState } from 'react';
import {
  ApiEndpoint,
  ApiParam,
  ApiHeader,
  ErrorCode,
  HttpMethod,
  EnvironmentType,
  ApiType,
  ParamType,
  ParamLocation,
} from '@/types';
import {
  uid,
  METHOD_COLORS,
  STATUS_COLORS,
  parseCurlToEndpoint,
  parseJsonToParams,
} from '@/lib/utils';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { FormField } from './FormField';
import { SectionHeader } from './SectionHeader';
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ENVIRONMENTS: EnvironmentType[] = ['Staging', 'UAT', 'Production'];
const API_TYPES: ApiType[] = ['auth', 'no-auth'];
const PARAM_TYPES: ParamType[] = [
  'string',
  'integer',
  'number',
  'boolean',
  'object',
  'array',
  'file',
];
const PARAM_LOCATIONS: ParamLocation[] = [
  'query',
  'body',
  'path',
  'header',
  'decrypted',
];

interface Props {
  endpoint: ApiEndpoint;
  onChange: (patch: Partial<ApiEndpoint>) => void;
}

function ParamRow({
  param,
  onChange,
  onDelete,
}: {
  param: ApiParam;
  onChange: (p: ApiParam) => void;
  onDelete: () => void;
}) {
  return (
    <div className='grid grid-cols-[1fr_90px_80px_60px_1fr_32px] gap-2 items-center mb-2'>
      <Input
        placeholder='name'
        value={param.name}
        onChange={(e) => onChange({ ...param, name: e.target.value })}
        mono
        className='text-xs'
      />
      <Select
        value={param.type}
        onChange={(e) =>
          onChange({ ...param, type: e.target.value as ParamType })
        }
      >
        {PARAM_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </Select>
      <Select
        value={param.location}
        onChange={(e) =>
          onChange({ ...param, location: e.target.value as ParamLocation })
        }
      >
        {PARAM_LOCATIONS.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </Select>
      <label className='flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none'>
        <input
          type='checkbox'
          checked={param.required}
          onChange={(e) => onChange({ ...param, required: e.target.checked })}
          className='rounded'
        />
        Req
      </label>
      <Input
        placeholder='description / example'
        value={param.description}
        onChange={(e) => onChange({ ...param, description: e.target.value })}
        className='text-xs'
      />
      <Button
        variant='ghost'
        size='icon'
        onClick={onDelete}
        className='text-muted-foreground hover:text-red-500 h-8 w-8'
      >
        <Trash2 size={13} />
      </Button>
    </div>
  );
}

function HeaderRow({
  header,
  onChange,
  onDelete,
}: {
  header: ApiHeader;
  onChange: (h: ApiHeader) => void;
  onDelete: () => void;
}) {
  return (
    <div className='grid grid-cols-[1fr_1fr_60px_32px] gap-2 items-center mb-2'>
      <Input
        placeholder='Header name'
        value={header.key}
        onChange={(e) => onChange({ ...header, key: e.target.value })}
        mono
        className='text-xs'
      />
      <Input
        placeholder='Value'
        value={header.value}
        onChange={(e) => onChange({ ...header, value: e.target.value })}
        mono
        className='text-xs'
      />
      <label className='flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none'>
        <input
          type='checkbox'
          checked={header.required}
          onChange={(e) => onChange({ ...header, required: e.target.checked })}
          className='rounded'
        />
        Req
      </label>
      <Button
        variant='ghost'
        size='icon'
        onClick={onDelete}
        className='text-muted-foreground hover:text-red-500 h-8 w-8'
      >
        <Trash2 size={13} />
      </Button>
    </div>
  );
}

function ErrorRow({
  err,
  onChange,
  onDelete,
}: {
  err: ErrorCode;
  onChange: (e: ErrorCode) => void;
  onDelete: () => void;
}) {
  return (
    <div className='grid grid-cols-[80px_1fr_32px] gap-2 items-center mb-2'>
      <Input
        placeholder='Code'
        value={err.code}
        onChange={(e) => onChange({ ...err, code: e.target.value })}
        mono
        className='text-xs'
      />
      <Input
        placeholder='Description'
        value={err.description}
        onChange={(e) => onChange({ ...err, description: e.target.value })}
        className='text-xs'
      />
      <Button
        variant='ghost'
        size='icon'
        onClick={onDelete}
        className='text-muted-foreground hover:text-red-500 h-8 w-8'
      >
        <Trash2 size={13} />
      </Button>
    </div>
  );
}

export function EndpointEditor({ endpoint: ep, onChange }: Props) {
  const [curlInput, setCurlInput] = useState('');
  const [curlError, setCurlError] = useState('');
  const [showCurlImport, setShowCurlImport] = useState(false);

  const patchEnvironment = (
    env: EnvironmentType,
    patch: Partial<{ baseUrl: string; apiType: ApiType }>,
  ) => {
    onChange({
      environments: {
        ...ep.environments,
        [env]: {
          ...ep.environments[env],
          ...patch,
        },
      },
    });
  };

  const updateParam = useCallback(
    (updated: ApiParam) => {
      onChange({
        params: ep.params.map((p) => (p.id === updated.id ? updated : p)),
      });
    },
    [ep.params, onChange],
  );

  const updateHeader = useCallback(
    (updated: ApiHeader) => {
      onChange({
        headers: ep.headers.map((h) => (h.id === updated.id ? updated : h)),
      });
    },
    [ep.headers, onChange],
  );

  const updateError = useCallback(
    (updated: ErrorCode) => {
      onChange({
        errorCodes: ep.errorCodes.map((e) =>
          e.id === updated.id ? updated : e,
        ),
      });
    },
    [ep.errorCodes, onChange],
  );

  const importCurl = () => {
    try {
      const patch = parseCurlToEndpoint(curlInput, ep);
      onChange(patch);
      setCurlError('');
    } catch (err) {
      setCurlError(
        err instanceof Error ? err.message : 'Failed to parse cURL command',
      );
    }
  };

  const formatJson = (text: string, field: keyof ApiEndpoint) => {
    try {
      const parsed = JSON.parse(text);
      onChange({ [field]: JSON.stringify(parsed, null, 2) });
    } catch (err) {
      // Logic for showing field-specific errors if needed
    }
  };

  const isInvalidJson = (text: string) => {
    if (!text.trim()) return false;
    try {
      JSON.parse(text);
      return false;
    } catch {
      return true;
    }
  };

  return (
    <div className='space-y-5 p-5 pb-16'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
          Import
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setShowCurlImport((v) => !v)}
        >
          {showCurlImport ? 'Hide cURL Paste' : 'Paste cURL'}
        </Button>
      </div>

      {showCurlImport && (
        <div className='space-y-2'>
          <Textarea
            value={curlInput}
            onChange={(e) => setCurlInput(e.target.value)}
            placeholder={
              'curl -X GET "https://api.example.com/users?page=1" -H "Authorization: Bearer token"'
            }
            rows={3}
            mono
          />
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={importCurl}
            >
              Autofill from cURL
            </Button>
            {curlError ? (
              <span className='text-xs text-red-500'>{curlError}</span>
            ) : null}
          </div>
        </div>
      )}

      {/* Method Strip */}
      <div className='flex flex-wrap gap-2 items-center'>
        <div className='flex gap-1'>
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => onChange({ method: m })}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-bold font-mono border transition-all',
                ep.method === m
                  ? METHOD_COLORS[m]
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-background',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Core Info */}
      <div className='grid grid-cols-2 gap-3'>
        <FormField label='Endpoint Name'>
          <Input
            value={ep.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder='Get Users'
            className='text-base font-semibold'
          />
        </FormField>
        <FormField label='Path'>
          <Input
            value={ep.path}
            onChange={(e) => onChange({ path: e.target.value })}
            placeholder='/v1/users/{id}'
            mono
          />
        </FormField>
      </div>

      {/* Environment URLs */}
      <div>
        <SectionHeader title='Environment URLs' />
        <div className='space-y-2'>
          {ENVIRONMENTS.map((env) => {
            const envCfg = ep.environments[env];
            return (
              <div
                key={env}
                className='grid grid-cols-[100px_1fr_140px] gap-2 items-center'
              >
                <span
                  className={cn(
                    'px-2.5 py-2 rounded-md text-xs font-semibold border text-center',
                    STATUS_COLORS[env],
                  )}
                >
                  {env}
                </span>
                <Input
                  value={envCfg.baseUrl}
                  onChange={(e) =>
                    patchEnvironment(env, { baseUrl: e.target.value })
                  }
                  placeholder='https://api.example.com'
                  mono
                />
                <Select
                  value={envCfg.apiType}
                  onChange={(e) =>
                    patchEnvironment(env, {
                      apiType: e.target.value as ApiType,
                    })
                  }
                >
                  {API_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'auth' ? 'Auth' : 'No Auth'}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      <FormField label='Description'>
        <Textarea
          value={ep.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder='What does this endpoint do?'
          rows={3}
        />
      </FormField>

      {/* Deprecation */}
      <div className='flex items-center gap-3'>
        <label className='flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none'>
          <input
            type='checkbox'
            checked={ep.deprecated ?? false}
            onChange={(e) => onChange({ deprecated: e.target.checked })}
            className='rounded'
          />
          <AlertTriangle size={13} className='text-amber-500' />
          Mark as Deprecated
        </label>
      </div>
      {ep.deprecated && (
        <FormField label='Deprecation Message'>
          <Input
            value={ep.deprecatedMessage ?? ''}
            onChange={(e) => onChange({ deprecatedMessage: e.target.value })}
            placeholder='Use /api/v2/users instead.'
          />
        </FormField>
      )}

      {/* Headers */}
      <div>
        <SectionHeader
          title='Request Headers'
          onAdd={() =>
            onChange({
              headers: [
                ...ep.headers,
                {
                  id: uid(),
                  key: '',
                  value: '',
                  required: false,
                  description: '',
                },
              ],
            })
          }
        />
        <div className='grid grid-cols-[1fr_1fr_60px_32px] gap-2 mb-1'>
          {['Key', 'Value', 'Req.', ''].map((h) => (
            <span
              key={h}
              className='text-[10px] text-muted-foreground/50 uppercase tracking-widest px-1'
            >
              {h}
            </span>
          ))}
        </div>
        {ep.headers.map((h) => (
          <HeaderRow
            key={h.id}
            header={h}
            onChange={updateHeader}
            onDelete={() =>
              onChange({ headers: ep.headers.filter((x) => x.id !== h.id) })
            }
          />
        ))}
        {ep.headers.length === 0 && (
          <p className='text-xs text-muted-foreground/50 py-2 italic'>
            No headers defined
          </p>
        )}
      </div>

      {/* Parameters */}
      <div>
        <SectionHeader
          title='Parameters'
          onAdd={() =>
            onChange({
              params: [
                ...ep.params,
                {
                  id: uid(),
                  name: '',
                  type: 'string',
                  location: 'query',
                  required: false,
                  description: '',
                  example: '',
                },
              ],
            })
          }
        />
        <div className='grid grid-cols-[1fr_90px_80px_60px_1fr_32px] gap-2 mb-1'>
          {['Name', 'Type', 'Location', 'Req.', 'Description', ''].map((h) => (
            <span
              key={h}
              className='text-[10px] text-muted-foreground/50 uppercase tracking-widest px-1'
            >
              {h}
            </span>
          ))}
        </div>
        {ep.params
          .filter((p) => p.location !== 'decrypted')
          .map((p) => (
            <ParamRow
              key={p.id}
              param={p}
              onChange={updateParam}
              onDelete={() =>
                onChange({ params: ep.params.filter((x) => x.id !== p.id) })
              }
            />
          ))}
        {ep.params.length === 0 && (
          <p className='text-xs text-muted-foreground/50 py-2 italic'>
            No parameters defined
          </p>
        )}
      </div>

      {/* Request Body */}
      <div>
        <div className='flex items-center gap-3 mb-2'>
          <SectionHeader title='Request Body' />
          <Select
            value={ep.requestBodyType}
            onChange={(e) =>
              onChange({ requestBodyType: e.target.value as any })
            }
            className='w-36 h-7 text-xs'
          >
            <option value='none'>None</option>
            <option value='json'>JSON</option>
            <option value='form-data'>Form Data</option>
          </Select>
          {ep.requestBodyType === 'json' && (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-[10px] text-muted-foreground hover:text-primary'
              onClick={() => formatJson(ep.requestBody, 'requestBody')}
              disabled={!ep.requestBody.trim() || isInvalidJson(ep.requestBody)}
            >
              Format JSON
            </Button>
          )}
        </div>
        {ep.requestBodyType !== 'none' && (
          <>
            <div className='relative'>
              <Textarea
                value={ep.requestBody}
                onChange={(e) => onChange({ requestBody: e.target.value })}
                placeholder={'{\n  "name": "string"\n}'}
                rows={5}
                mono
                className={cn(
                  ep.requestBodyType === 'json' &&
                    isInvalidJson(ep.requestBody) &&
                    'border-red-500/50 focus-visible:ring-red-500/20',
                )}
              />
              {ep.requestBodyType === 'json' &&
                isInvalidJson(ep.requestBody) && (
                  <span className='absolute right-2 bottom-2 text-[10px] text-red-500 font-medium'>
                    Invalid JSON
                  </span>
                )}
            </div>
            <div className='mt-3 flex items-center gap-2'>
              <label className='flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none'>
                <input
                  type='checkbox'
                  checked={ep.isEncrypted}
                  onChange={(e) => onChange({ isEncrypted: e.target.checked })}
                  className='rounded'
                />
                Request body is encrypted
              </label>
            </div>
            {ep.isEncrypted && (
              <div className='mt-3 space-y-4'>
                <FormField label='Decrypted Request Body'>
                  <Textarea
                    value={ep.decryptedRequestBody ?? ''}
                    onChange={(e) =>
                      onChange({ decryptedRequestBody: e.target.value })
                    }
                    placeholder={'{\n  "decryptedPayload": "value"\n}'}
                    rows={5}
                    mono
                  />
                </FormField>

                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <SectionHeader
                      title='Decrypted Parameters'
                      onAdd={() =>
                        onChange({
                          params: [
                            ...ep.params,
                            {
                              id: uid(),
                              name: '',
                              type: 'string',
                              location: 'decrypted',
                              required: false,
                              description: '',
                              example: '',
                            },
                          ],
                        })
                      }
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-7 px-2 text-[10px] text-muted-foreground hover:text-primary'
                      onClick={() => {
                        const newParams = parseJsonToParams(
                          ep.decryptedRequestBody || '',
                          'decrypted',
                        );
                        // Filter out existing decrypted params that have the same name as new ones
                        const filteredExisting = ep.params.filter(
                          (p) =>
                            p.location !== 'decrypted' ||
                            !newParams.some((np) => np.name === p.name),
                        );
                        onChange({
                          params: [...filteredExisting, ...newParams],
                        });
                      }}
                      disabled={!ep.decryptedRequestBody?.trim()}
                    >
                      Autofill from JSON
                    </Button>
                  </div>
                  <div className='grid grid-cols-[1fr_90px_80px_60px_1fr_32px] gap-2 mb-1'>
                    {[
                      'Name',
                      'Type',
                      'Location',
                      'Req.',
                      'Description',
                      '',
                    ].map((h) => (
                      <span
                        key={h}
                        className='text-[10px] text-muted-foreground/50 uppercase tracking-widest px-1'
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {ep.params
                    .filter((p) => p.location === 'decrypted')
                    .map((p) => (
                      <ParamRow
                        key={p.id}
                        param={p}
                        onChange={updateParam}
                        onDelete={() =>
                          onChange({
                            params: ep.params.filter((x) => x.id !== p.id),
                          })
                        }
                      />
                    ))}
                  {ep.params.filter((p) => p.location === 'decrypted')
                    .length === 0 && (
                    <p className='text-xs text-muted-foreground/50 py-2 italic'>
                      No decrypted parameters defined
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Response */}
      <div>
        <div className='flex items-center gap-3 mb-2'>
          <SectionHeader title='Response Example' />
          <Input
            value={ep.responseStatusCode}
            onChange={(e) => onChange({ responseStatusCode: e.target.value })}
            placeholder='200'
            className='w-20 h-7 text-xs font-mono text-center'
          />
          <Button
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-[10px] text-muted-foreground hover:text-primary'
            onClick={() => formatJson(ep.responseExample, 'responseExample')}
            disabled={
              !ep.responseExample.trim() || isInvalidJson(ep.responseExample)
            }
          >
            Format JSON
          </Button>
        </div>
        <div className='relative'>
          <Textarea
            value={ep.responseExample}
            onChange={(e) => onChange({ responseExample: e.target.value })}
            rows={7}
            mono
            className={cn(
              isInvalidJson(ep.responseExample) &&
                'border-red-500/50 focus-visible:ring-red-500/20',
            )}
          />
          {isInvalidJson(ep.responseExample) && (
            <span className='absolute right-2 bottom-2 text-[10px] text-red-500 font-medium'>
              Invalid JSON
            </span>
          )}
        </div>
      </div>

      {/* Error Codes */}
      <div>
        <SectionHeader
          title='Error Codes'
          onAdd={() =>
            onChange({
              errorCodes: [
                ...ep.errorCodes,
                { id: uid(), code: '', description: '' },
              ],
            })
          }
        />
        {ep.errorCodes.map((e) => (
          <ErrorRow
            key={e.id}
            err={e}
            onChange={updateError}
            onDelete={() =>
              onChange({
                errorCodes: ep.errorCodes.filter((x) => x.id !== e.id),
              })
            }
          />
        ))}
        {ep.errorCodes.length === 0 && (
          <p className='text-xs text-muted-foreground/50 py-2 italic'>
            No error codes defined
          </p>
        )}
      </div>

      {/* Notes */}
      <FormField label='Notes & Additional Info'>
        <Textarea
          value={ep.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder='Rate limiting, versioning notes, deprecation warnings...'
          rows={3}
        />
      </FormField>
    </div>
  );
}
