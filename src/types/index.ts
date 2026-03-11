export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ParamType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'file'
  | 'integer'
  | 'uuid'
  | 'date';
export type ParamLocation = 'query' | 'body' | 'header' | 'path' | 'decrypted';
export type EnvironmentType = 'Staging' | 'UAT' | 'Production';
export type EndpointStatus = EnvironmentType;
export type ApiType = 'auth' | 'no-auth';
export type PreviewMode = 'rich' | 'markdown' | 'curl';
export type Theme = 'light' | 'dark' | 'system';

export interface ApiParam {
  id: string;
  name: string;
  type: ParamType;
  location: ParamLocation;
  required: boolean;
  description: string;
  example?: string;
  defaultValue?: string;
}

export interface ApiHeader {
  id: string;
  key: string;
  value: string;
  required: boolean;
  description?: string;
}

export interface ErrorCode {
  id: string;
  code: string;
  description: string;
}

export interface EnvironmentConfig {
  baseUrl: string;
  apiType: ApiType;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  status: EndpointStatus;
  path: string;
  environments: Record<EnvironmentType, EnvironmentConfig>;
  description: string;
  headers: ApiHeader[];
  params: ApiParam[];
  requestBody: string;
  isEncrypted: boolean;
  decryptedRequestBody?: string;
  requestBodyType: 'json' | 'form-data' | 'none';
  responseExample: string;
  responseStatusCode: string;
  errorCodes: ErrorCode[];
  notes: string;
  deprecated?: boolean;
  deprecatedMessage?: string;
}

export type Endpoint = ApiEndpoint;
export type Parameter = ApiParam;
export type Header = ApiHeader;
