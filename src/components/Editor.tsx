import { EndpointEditor } from './EndpointEditor'
import type { ApiEndpoint } from '@/types'

interface EditorProps {
  endpoint: ApiEndpoint
  onChange: (patch: Partial<ApiEndpoint>) => void
}

export function Editor({ endpoint, onChange }: EditorProps) {
  return <EndpointEditor endpoint={endpoint} onChange={onChange} />
}
