export interface ExportDecl {
  name: string
  kind: 'function' | 'class' | 'variable' | 'type'
  line: number
}

export interface FunctionInfo {
  name: string
  isAsync: boolean
  isExported: boolean
  params: string[]
  returnType?: string
  line: number
}

export interface MethodInfo {
  name: string
  kind: string
  isAsync: boolean
  isStatic: boolean
  isPrivate: boolean
  params: string[]
  returnType?: string
  line: number
}

export interface ClassInfo {
  name: string
  extends?: string
  implements: string[]
  isAbstract: boolean
  methods: MethodInfo[]
  properties: Array<{ name: string; type?: string; isStatic: boolean; isReadonly: boolean; isPrivate: boolean }>
  isExported: boolean
  line: number
}

export interface TypeInfo {
  name: string
  kind: 'interface' | 'type' | 'enum'
  definition: string
  isExported: boolean
  line: number
}

export interface RawFileNode {
  id: string
  folder: string
  label: string
  size: number
  content: string
  exports: ExportDecl[]
  functions: FunctionInfo[]
  classes: ClassInfo[]
  types: TypeInfo[]
  skeleton: string
}

export interface RawEdge {
  id: string
  source: string
  target: string
  type: 'import' | 'call' | 'renders'
  label?: string
}

export interface RawGraphData {
  nodes: RawFileNode[]
  edges: RawEdge[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  highlightedNodes?: string[]
}
