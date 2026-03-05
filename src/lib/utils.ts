import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ApiEndpoint, ApiParam, ApiHeader, ErrorCode, HttpMethod, EndpointStatus, EnvironmentType, ApiType, ParamType } from '../types'
import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800',
  POST: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800',
  PUT: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800',
  PATCH: 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/50 dark:border-violet-800',
  DELETE: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800',
}

export const STATUS_COLORS: Record<EndpointStatus, string> = {
  Staging: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800',
  UAT: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800',
  Production: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800',
}

export function defaultEndpoint(): ApiEndpoint {
  return {
    id: uid(),
    name: '',
    method: 'GET',
    path: '',
    status: 'Staging',
    environments: {
      Staging: { baseUrl: '', apiType: 'no-auth' },
      UAT: { baseUrl: '', apiType: 'no-auth' },
      Production: { baseUrl: '', apiType: 'no-auth' },
    },
    description: '',
    headers: [],
    params: [],
    requestBody: '',
    isEncrypted: false,
    decryptedRequestBody: '',
    requestBodyType: 'none',
    responseExample: '',
    responseStatusCode: '',
    errorCodes: [],
    notes: '',
    deprecated: false,
  }
}
function getEnvironmentConfig(ep: ApiEndpoint) {
  return ep.environments[ep.status]
}

const ENVIRONMENTS = ['Staging', 'UAT', 'Production'] as const

function unquote(token: string): string {
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1)
  }
  return token
}

function tokenizeCurl(curl: string): string[] {
  const compact = curl.replace(/\\\r?\n/g, ' ')
  const parts = compact.match(/"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\S+/g)
  return parts ? parts.map((p) => unquote(p.trim())) : []
}

function inferEnvironmentFromHost(host: string): EnvironmentType {
  const h = host.toLowerCase()
  if (h.includes('staging') || h.includes('stage')) return 'Staging'
  if (h.includes('uat')) return 'UAT'
  if (h.includes('prod') || h.startsWith('api.') || h.includes('production')) return 'Production'
  return 'Staging'
}

function inferParamType(value: string): ParamType {
  if (/^-?\d+$/.test(value)) return 'integer'
  if (/^-?\d+\.\d+$/.test(value)) return 'number'
  if (value === 'true' || value === 'false') return 'boolean'
  return 'string'
}

export function parseCurlToEndpoint(curl: string, current: ApiEndpoint): Partial<ApiEndpoint> {
  const tokens = tokenizeCurl(curl)
  if (tokens.length === 0 || tokens[0].toLowerCase() !== 'curl') {
    throw new Error('Invalid cURL command')
  }

  let method: HttpMethod = 'GET'
  let urlText = ''
  const headers: ApiHeader[] = []
  let data = ''

  for (let i = 1; i < tokens.length; i += 1) {
    const t = tokens[i]
    if (t === '-X' || t === '--request') {
      const m = (tokens[i + 1] || '').toUpperCase()
      if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) method = m as HttpMethod
      i += 1
      continue
    }
    if (t === '-H' || t === '--header') {
      const rawHeader = tokens[i + 1] || ''
      const sep = rawHeader.indexOf(':')
      if (sep > 0) {
        const key = rawHeader.slice(0, sep).trim()
        const value = rawHeader.slice(sep + 1).trim()
        headers.push({ id: uid(), key, value, required: false, description: '' })
      }
      i += 1
      continue
    }
    if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      data = tokens[i + 1] || ''
      i += 1
      continue
    }
    if (t.startsWith('http://') || t.startsWith('https://')) {
      urlText = t
    }
  }

  if (!urlText) {
    throw new Error('No URL found in cURL command')
  }

  const parsedUrl = new URL(urlText)
  const inferredEnv = inferEnvironmentFromHost(parsedUrl.hostname)
  const hasAuthHeader = headers.some((h) => h.key.toLowerCase() === 'authorization')
  const apiType: ApiType = hasAuthHeader ? 'auth' : 'no-auth'

  let requestBodyType: ApiEndpoint['requestBodyType'] = 'none'
  const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type')?.value.toLowerCase() || ''
  if (data) {
    if (contentTypeHeader.includes('application/json') || data.trim().startsWith('{') || data.trim().startsWith('[')) {
      requestBodyType = 'json'
    } else {
      requestBodyType = 'form-data'
    }
    if (method === 'GET') method = 'POST'
  }

  const queryParams: ApiParam[] = []
  parsedUrl.searchParams.forEach((value, key) => {
    queryParams.push({
      id: uid(),
      name: key,
      type: inferParamType(value),
      location: 'query',
      required: false,
      description: '',
      example: value,
      defaultValue: value,
    })
  })

  return {
    name: current.name || `${method} ${parsedUrl.pathname}`.trim(),
    method,
    path: parsedUrl.pathname,
    status: inferredEnv,
    environments: {
      ...current.environments,
      [inferredEnv]: {
        baseUrl: parsedUrl.origin,
        apiType,
      },
    },
    headers,
    params: queryParams,
    requestBody: data,
    requestBodyType,
    isEncrypted: false,
    decryptedRequestBody: '',
  }
}

export function generateMarkdown(ep: ApiEndpoint): string {
  const endpointName = ep.name || 'Untitled API'
  const envConfig = getEnvironmentConfig(ep)
  const envRows = ENVIRONMENTS.map((env) => {
    const cfg = ep.environments[env]
    return `| ${env} | \`${cfg.baseUrl}${ep.path}\` | ${cfg.apiType === 'auth' ? 'Auth' : 'No Auth'} |`
  }).join('\n')
  const headerRows = ep.headers.map(h =>
    `| \`${h.key}\` | \`${h.value}\` | ${h.required ? 'Yes' : '-'} | ${h.description ?? ''} |`
  ).join('\n')

  const paramRows = ep.params.map(p =>
    `| \`${p.name}\` | \`${p.type}\` | ${p.location} | ${p.required ? 'Yes' : '-'} | ${p.defaultValue ? `\`${p.defaultValue}\`` : '-'} | ${p.description}${p.example ? ` (e.g. \`${p.example}\`)` : ''} |`
  ).join('\n')

  const errorRows = ep.errorCodes.map(e =>
    `| \`${e.code}\` | ${e.description} |`
  ).join('\n')

  return `# ${endpointName}

> **${ep.method}** \`${envConfig.baseUrl}${ep.path}\`

**Environment:** ${ep.status} | **API Type:** ${envConfig.apiType === 'auth' ? 'Auth' : 'No Auth'}

## Environment URLs

| Environment | URL | API Type |
|-------------|-----|----------|
${envRows}

---

## Overview

${ep.description}

${ep.deprecated ? `> **Deprecated:** ${ep.deprecatedMessage || 'This endpoint is deprecated and may be removed in a future version.'}\n` : ''}
${ep.headers.length ? `## Request Headers

| Header | Value | Required | Description |
|--------|-------|:--------:|-------------|
${headerRows}
` : ''}
${ep.params.length ? `## Parameters

| Name | Type | Location | Required | Default | Description |
|------|------|----------|:--------:|---------|-------------|
${paramRows}
` : ''}
${ep.requestBody && ep.requestBodyType !== 'none' ? `## Request Body

Content-Type: \`application/${ep.requestBodyType === 'json' ? 'json' : 'x-www-form-urlencoded'}\`

\`\`\`json
${ep.requestBody}
\`\`\`
` : ''}
${ep.isEncrypted && ep.decryptedRequestBody ? `## Decrypted Request Body

\`\`\`json
${ep.decryptedRequestBody}
\`\`\`
` : ''}
## Response

**Status:** \`${ep.responseStatusCode}\`

\`\`\`json
${ep.responseExample}
\`\`\`

${ep.errorCodes.length ? `## Error Codes

| Code | Description |
|------|-------------|
${errorRows}
` : ''}
${ep.notes ? `## Notes

${ep.notes}` : ''}
---
*Generated with API Docs Builder*`
}

export function generateCurl(ep: ApiEndpoint): string {
  const envConfig = getEnvironmentConfig(ep)
  const filteredHeaders = envConfig.apiType === 'no-auth'
    ? ep.headers.filter(h => h.key.toLowerCase() !== 'authorization')
    : ep.headers
  const headerLines = filteredHeaders.map(h => `  -H "${h.key}: ${h.value}"`).join(' \\\n')
  const qParams = ep.params.filter(p => p.location === 'query' && p.name)
  const qs = qParams.length ? '?' + qParams.map(p => `${p.name}=${p.example || `<${p.name}>`}`).join('&') : ''
  const bodyLine = ep.requestBody && ep.requestBodyType !== 'none'
    ? ` \\\n  -d '${ep.requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'`
    : ''
  const methodFlag = ep.method !== 'GET' ? ` \\\n  -X ${ep.method}` : ''

  return `curl "${envConfig.baseUrl}${ep.path}${qs}"${methodFlag}${headerLines ? ' \\\n' + headerLines : ''}${bodyLine}`
}

function textOrDash(value?: string): string {
  return value && value.trim().length > 0 ? value : '-'
}

function boolText(value: boolean): string {
  return value ? 'Yes' : 'No'
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
  })
}

function dataTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((header) =>
          new TableCell({
            shading: { fill: 'E5E7EB' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header, bold: true })],
              }),
            ],
          }),
        ),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((cell) =>
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
              },
              children: [new Paragraph({ text: textOrDash(cell) })],
            }),
          ),
        }),
      ),
    ],
  })
}

function codeBlock(content: string): Table {
  const lines = content.split('\n')
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F3F4F6' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            },
            children: lines.map((line) =>
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 19 })],
              }),
            ),
          }),
        ],
      }),
    ],
  })
}

export async function generateDocx(ep: ApiEndpoint): Promise<Blob> {
  const endpointName = ep.name || 'Untitled API'
  const envConfig = getEnvironmentConfig(ep)
  const envRows = ENVIRONMENTS.map((env) => {
    const cfg = ep.environments[env]
    return [env, `${cfg.baseUrl}${ep.path}`, cfg.apiType === 'auth' ? 'Auth' : 'No Auth']
  })
  const children: Array<Paragraph | Table> = []

  children.push(
    new Paragraph({
      text: endpointName,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
  )

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${ep.method} ${envConfig.baseUrl}${ep.path}`, bold: true })],
      spacing: { after: 160 },
    }),
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Environment: ', bold: true }),
        new TextRun(ep.status),
        new TextRun({ text: '   API Type: ', bold: true }),
        new TextRun(envConfig.apiType === 'auth' ? 'Auth' : 'No Auth'),
      ],
      spacing: { after: 100 },
    }),
  )

  children.push(sectionTitle('Environment URLs'))
  children.push(
    dataTable(
      ['Environment', 'URL', 'API Type'],
      envRows,
    ),
  )

  if (ep.deprecated) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Deprecated: ', bold: true, color: 'B91C1C' }),
          new TextRun(ep.deprecatedMessage || 'This endpoint is deprecated.'),
        ],
        spacing: { after: 120 },
      }),
    )
  }

  children.push(sectionTitle('Overview'))
  children.push(new Paragraph({ text: textOrDash(ep.description) }))

  if (ep.headers.length) {
    children.push(sectionTitle('Request Headers'))
    children.push(
      dataTable(
        ['Header', 'Value', 'Required', 'Description'],
        ep.headers.map((h: ApiHeader) => [h.key, h.value, boolText(h.required), textOrDash(h.description)]),
      ),
    )
  }

  if (ep.params.length) {
    children.push(sectionTitle('Parameters'))
    children.push(
      dataTable(
        ['Name', 'Type', 'Location', 'Required', 'Default', 'Description'],
        ep.params.map((p: ApiParam) => [
          p.name,
          p.type,
          p.location,
          boolText(p.required),
          textOrDash(p.defaultValue),
          `${textOrDash(p.description)}${p.example ? ` (e.g. ${p.example})` : ''}`,
        ]),
      ),
    )
  }

  if (ep.requestBody && ep.requestBodyType !== 'none') {
    children.push(sectionTitle('Request Body'))
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Content-Type: ', bold: true }),
          new TextRun(ep.requestBodyType === 'json' ? 'application/json' : 'multipart/form-data'),
        ],
      }),
    )
    children.push(codeBlock(ep.requestBody))
  }

  if (ep.isEncrypted && ep.decryptedRequestBody) {
    children.push(sectionTitle('Decrypted Request Body'))
    children.push(codeBlock(ep.decryptedRequestBody))
  }

  children.push(sectionTitle('Response'))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Status: ', bold: true }), new TextRun(ep.responseStatusCode)],
      spacing: { after: 100 },
    }),
  )
  children.push(codeBlock(ep.responseExample))

  children.push(sectionTitle('cURL Example'))
  children.push(codeBlock(generateCurl(ep)))

  if (ep.errorCodes.length) {
    children.push(sectionTitle('Error Codes'))
    children.push(
      dataTable(
        ['Code', 'Description'],
        ep.errorCodes.map((e: ErrorCode) => [e.code, e.description]),
      ),
    )
  }

  if (ep.notes) {
    children.push(sectionTitle('Notes'))
    children.push(new Paragraph({ text: ep.notes }))
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Generated with API Docs Builder', italics: true, color: '6B7280' })],
      spacing: { before: 260 },
    }),
  )

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

