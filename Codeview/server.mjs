#!/usr/bin/env node
// CodeSight dev server — full AST analysis with signatures, class hierarchy, and JSX render edges.
// Usage: node server.mjs [path/to/project]

import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { parse } from '@babel/parser'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let ROOT = path.resolve(process.argv[2] ?? process.cwd())
const PORT = 3001

// Clone state — shared across requests
let cloneState = { status: 'idle', message: '', repoUrl: '' }
const IGNORE = ['node_modules', 'dist', 'build', '.git', 'out', '.next', 'coverage', '.cache', '__pycache__']

// Workspace package map: package-name → absolute path to package root
let workspacePackages = new Map()

function buildWorkspaceMap(root) {
  workspacePackages = new Map()
  try {
    const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
    let patterns = rootPkg.workspaces
    if (!patterns) return
    if (!Array.isArray(patterns)) patterns = patterns.packages ?? []

    for (const pattern of patterns) {
      if (pattern.endsWith('/*')) {
        const dir = path.join(root, pattern.slice(0, -2))
        let entries
        try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { continue }
        for (const e of entries) {
          if (e.isDirectory()) registerWorkspacePkg(path.join(dir, e.name))
        }
      } else {
        registerWorkspacePkg(path.join(root, pattern))
      }
    }
  } catch { /* no package.json or no workspaces field */ }
  console.log(`  Workspace packages: ${workspacePackages.size}`)
}

function registerWorkspacePkg(pkgDir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'))
    if (pkg.name) workspacePackages.set(pkg.name, pkgDir)
  } catch {}
}

function resolveWorkspaceImport(importPath) {
  for (const [pkgName, pkgRoot] of workspacePackages) {
    if (importPath !== pkgName && !importPath.startsWith(pkgName + '/')) continue

    const rel = p => path.relative(ROOT, p).replace(/\\/g, '/')
    const subPath = importPath === pkgName ? null : importPath.slice(pkgName.length + 1)

    if (subPath) {
      const base = path.join(pkgRoot, subPath)
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
        if (fs.existsSync(base + ext)) return rel(base + ext)
        const idx = path.join(base, 'index') + ext
        if (fs.existsSync(idx)) return rel(idx)
      }
      return null
    }

    // Main entry — try package.json exports/main then index files
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'))
      const entry = typeof pkg.exports === 'string'
        ? pkg.exports
        : pkg.exports?.['.'] ?? pkg.main
      if (entry) {
        const abs = path.resolve(pkgRoot, entry.replace(/\.js$/, ''))
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '']) {
          if (fs.existsSync(abs + ext)) return rel(abs + ext)
        }
      }
    } catch {}

    // Fallback: src/index or index
    for (const base of ['src/index', 'index']) {
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
        const p = path.join(pkgRoot, base) + ext
        if (fs.existsSync(p)) return rel(p)
      }
    }
    return null
  }
  return null
}

// ── Utilities ────────────────────────────────────────────────────────────────

function shouldIgnore(p) {
  return IGNORE.some(seg => p.split(path.sep).includes(seg))
}

function collectFiles() {
  const results = []
  function walk(dir) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (shouldIgnore(full)) continue
      if (e.isDirectory()) { walk(full); continue }
      if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) results.push(full)
    }
  }
  walk(ROOT)
  return results
}

function resolveImport(fromFile, importPath) {
  if (importPath.startsWith('.')) {
    const base = path.resolve(path.dirname(fromFile), importPath)
    const rel = p => path.relative(ROOT, p).replace(/\\/g, '/')
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
      if (fs.existsSync(base + ext)) return rel(base + ext)
      const idx = path.join(base, 'index') + ext
      if (fs.existsSync(idx)) return rel(idx)
    }
    return null
  }
  return resolveWorkspaceImport(importPath)
}

// ── Type serialization ────────────────────────────────────────────────────────

function typeToString(node) {
  if (!node) return '?'
  try {
    switch (node.type) {
      case 'TSStringKeyword':    return 'string'
      case 'TSNumberKeyword':    return 'number'
      case 'TSBooleanKeyword':   return 'boolean'
      case 'TSVoidKeyword':      return 'void'
      case 'TSAnyKeyword':       return 'any'
      case 'TSNullKeyword':      return 'null'
      case 'TSUndefinedKeyword': return 'undefined'
      case 'TSNeverKeyword':     return 'never'
      case 'TSUnknownKeyword':   return 'unknown'
      case 'TSObjectKeyword':    return 'object'
      case 'TSSymbolKeyword':    return 'symbol'
      case 'TSBigIntKeyword':    return 'bigint'
      case 'TSTypeReference': {
        const name = node.typeName?.name ?? node.typeName?.right?.name ?? '?'
        if (!node.typeParameters) return name
        return `${name}<${node.typeParameters.params.map(typeToString).join(', ')}>`
      }
      case 'TSArrayType':         return `${typeToString(node.elementType)}[]`
      case 'TSUnionType':         return node.types.map(typeToString).join(' | ')
      case 'TSIntersectionType':  return node.types.map(typeToString).join(' & ')
      case 'TSParenthesizedType': return `(${typeToString(node.typeAnnotation)})`
      case 'TSOptionalType':      return `${typeToString(node.typeAnnotation)}?`
      case 'TSRestType':          return `...${typeToString(node.typeAnnotation)}`
      case 'TSFunctionType': {
        const ps = (node.params ?? []).map(paramToString).join(', ')
        const ret = typeToString(node.typeAnnotation?.typeAnnotation ?? node.returnType?.typeAnnotation)
        return `(${ps}) => ${ret}`
      }
      case 'TSTupleType':
        return `[${(node.elementTypes ?? node.elements ?? []).map(typeToString).join(', ')}]`
      case 'TSLiteralType': {
        const v = node.literal?.value ?? node.literal?.name
        return typeof v === 'string' ? `"${v}"` : String(v ?? '?')
      }
      case 'TSIndexedAccessType':
        return `${typeToString(node.objectType)}[${typeToString(node.indexType)}]`
      case 'TSTypeLiteral': {
        const ms = (node.members ?? []).slice(0, 3).map(m => {
          if (m.type === 'TSPropertySignature') {
            const k = m.key?.name ?? m.key?.value ?? '?'
            const t = m.typeAnnotation ? typeToString(m.typeAnnotation.typeAnnotation) : 'unknown'
            return `${k}${m.optional ? '?' : ''}: ${t}`
          }
          return '…'
        })
        if ((node.members?.length ?? 0) > 3) ms.push('…')
        return `{ ${ms.join('; ')} }`
      }
      case 'TSConditionalType':
        return `${typeToString(node.checkType)} extends ${typeToString(node.extendsType)} ? ${typeToString(node.trueType)} : ${typeToString(node.falseType)}`
      case 'TSMappedType':    return '{ [mapped] }'
      case 'TSTypeQuery':     return `typeof ${node.exprName?.name ?? '?'}`
      case 'TSTypeOperator':  return `${node.operator} ${typeToString(node.typeAnnotation)}`
      case 'TSNamedTupleMember': return `${node.label?.name ?? '?'}: ${typeToString(node.elementType)}`
      default:                return '?'
    }
  } catch { return '?' }
}

function paramToString(param) {
  if (!param) return '?'
  try {
    let name = '?', optional = '', rest = ''
    switch (param.type) {
      case 'Identifier':
        name = param.name; optional = param.optional ? '?' : ''; break
      case 'RestElement':
        rest = '...'; name = param.argument?.name ?? '…'; break
      case 'AssignmentPattern':
        name = param.left?.name ?? '…'; optional = '?'; break
      case 'ObjectPattern': name = '{…}'; break
      case 'ArrayPattern':  name = '[…]'; break
      case 'TSParameterProperty': return paramToString(param.parameter)
    }
    const t = param.typeAnnotation?.typeAnnotation
    return `${rest}${name}${optional}${t ? `: ${typeToString(t)}` : ''}`
  } catch { return '?' }
}

// ── AST extraction helpers ────────────────────────────────────────────────────

function extractFn(node, isExported) {
  return {
    name: node.id?.name ?? 'anonymous',
    isAsync: node.async ?? false,
    isExported,
    params: (node.params ?? []).map(paramToString),
    returnType: node.returnType ? typeToString(node.returnType.typeAnnotation) : undefined,
    line: node.loc?.start.line ?? 0
  }
}

function extractClass(node, isExported) {
  const methods = [], properties = []
  for (const m of (node.body?.body ?? [])) {
    if (m.type === 'ClassMethod' || m.type === 'TSDeclareMethod') {
      const key = m.key?.type === 'Identifier' ? m.key.name : (m.key?.value ?? '?')
      methods.push({
        name: key,
        kind: m.kind ?? 'method',
        isAsync: m.async ?? false,
        isStatic: m.static ?? false,
        isPrivate: m.accessibility === 'private' || m.key?.type === 'PrivateName',
        params: (m.params ?? []).map(paramToString),
        returnType: m.returnType ? typeToString(m.returnType.typeAnnotation) : undefined,
        line: m.loc?.start.line ?? 0
      })
    } else if (m.type === 'ClassProperty' || m.type === 'ClassAccessorProperty') {
      const key = m.key?.type === 'Identifier' ? m.key.name : (m.key?.value ?? '?')
      properties.push({
        name: key,
        type: m.typeAnnotation ? typeToString(m.typeAnnotation.typeAnnotation) : undefined,
        isStatic: m.static ?? false,
        isReadonly: m.readonly ?? false,
        isPrivate: m.accessibility === 'private'
      })
    }
  }
  return {
    name: node.id?.name ?? 'anonymous',
    extends: node.superClass?.name ?? node.superClass?.object?.name,
    implements: (node.implements ?? []).map(i => i.expression?.name ?? '?').filter(Boolean),
    isAbstract: node.abstract ?? false,
    methods, properties, isExported,
    line: node.loc?.start.line ?? 0
  }
}

function extractInterface(node) {
  const props = []
  for (const m of (node.body?.body ?? [])) {
    if (m.type === 'TSPropertySignature') {
      const k = m.key?.name ?? m.key?.value
      if (!k) continue
      const t = m.typeAnnotation ? typeToString(m.typeAnnotation.typeAnnotation) : 'unknown'
      props.push(`${k}${m.optional ? '?' : ''}: ${t}`)
    } else if (m.type === 'TSMethodSignature') {
      const k = m.key?.name ?? m.key?.value
      if (!k) continue
      const ps = (m.parameters ?? []).map(paramToString).join(', ')
      const ret = m.typeAnnotation ? typeToString(m.typeAnnotation.typeAnnotation) : 'void'
      props.push(`${k}(${ps}): ${ret}`)
    } else if (m.type === 'TSIndexSignature') {
      const ps = (m.parameters ?? []).map(paramToString).join(', ')
      const ret = m.typeAnnotation ? typeToString(m.typeAnnotation.typeAnnotation) : 'unknown'
      props.push(`[${ps}]: ${ret}`)
    }
  }
  const ext = (node.extends ?? []).map(e => e.expression?.name).filter(Boolean)
  const body = props.length > 6 ? [...props.slice(0, 6), '…'] : props
  return {
    name: node.id?.name,
    kind: 'interface',
    definition: `interface ${node.id?.name}${ext.length ? ` extends ${ext.join(', ')}` : ''} { ${body.join('; ')} }`,
    isExported: false, line: node.loc?.start.line ?? 0
  }
}

function extractTypeAlias(node) {
  return {
    name: node.id?.name,
    kind: 'type',
    definition: `type ${node.id?.name} = ${typeToString(node.typeAnnotation)}`,
    isExported: false, line: node.loc?.start.line ?? 0
  }
}

function extractEnum(node) {
  const members = (node.members ?? []).map(m => m.id?.name ?? m.id?.value).filter(Boolean)
  const shown = members.slice(0, 6)
  if (members.length > 6) shown.push('…')
  return {
    name: node.id?.name,
    kind: 'enum',
    definition: `enum ${node.id?.name} { ${shown.join(', ')} }`,
    isExported: false, line: node.loc?.start.line ?? 0
  }
}

// ── Top-level statement analysis ─────────────────────────────────────────────

function analyzeStatement(stmt, out, isExported) {
  const line = stmt.loc?.start.line ?? 0
  switch (stmt.type) {

    case 'ImportDeclaration': {
      const localNames = new Map()
      const specifiers = []
      for (const s of (stmt.specifiers ?? [])) {
        if (s.type === 'ImportDefaultSpecifier') {
          specifiers.push('default'); localNames.set(s.local.name, 'default')
        } else if (s.type === 'ImportNamespaceSpecifier') {
          specifiers.push('*'); localNames.set(s.local.name, '*')
        } else {
          const exp = s.imported?.name ?? s.imported?.value ?? s.local.name
          specifiers.push(exp); localNames.set(s.local.name, exp)
        }
      }
      out.imports.push({ source: stmt.source.value, specifiers, localNames })
      break
    }

    case 'ExportNamedDeclaration': {
      if (stmt.declaration) analyzeStatement(stmt.declaration, out, true)
      for (const s of (stmt.specifiers ?? []))
        if (s.type === 'ExportSpecifier') {
          const name = s.exported?.name ?? s.exported?.value
          if (name) out.exports.push({ name, kind: 'variable', line })
        }
      break
    }

    case 'ExportDefaultDeclaration': {
      const d = stmt.declaration
      if (d.type === 'FunctionDeclaration') {
        const fn = extractFn(d, true)
        out.functions.push(fn)
        out.exports.push({ name: fn.name ?? 'default', kind: 'function', line })
      } else if (d.type === 'ClassDeclaration') {
        const cls = extractClass(d, true)
        out.classes.push(cls)
        out.exports.push({ name: cls.name ?? 'default', kind: 'class', line })
      } else if (d.type === 'ArrowFunctionExpression' || d.type === 'FunctionExpression') {
        const fn = { ...extractFn(d, true), name: 'default' }
        out.functions.push(fn)
        out.exports.push({ name: 'default', kind: 'function', line })
      } else {
        out.exports.push({ name: 'default', kind: 'variable', line })
      }
      break
    }

    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      if (stmt.id) {
        out.functions.push(extractFn(stmt, isExported))
        if (isExported) out.exports.push({ name: stmt.id.name, kind: 'function', line })
      }
      break

    case 'ClassDeclaration':
      if (stmt.id) {
        out.classes.push(extractClass(stmt, isExported))
        if (isExported) out.exports.push({ name: stmt.id.name, kind: 'class', line })
      }
      break

    case 'VariableDeclaration':
      for (const d of (stmt.declarations ?? [])) {
        if (d.id?.type !== 'Identifier') continue
        const name = d.id.name
        if (d.init?.type === 'ArrowFunctionExpression' || d.init?.type === 'FunctionExpression') {
          out.functions.push(extractFn({ ...d.init, id: d.id }, isExported))
          if (isExported) out.exports.push({ name, kind: 'function', line })
        } else {
          if (isExported) out.exports.push({ name, kind: 'variable', line })
        }
      }
      break

    case 'TSInterfaceDeclaration': {
      const t = extractInterface(stmt); t.isExported = isExported
      out.types.push(t)
      if (isExported && stmt.id) out.exports.push({ name: stmt.id.name, kind: 'type', line })
      break
    }
    case 'TSTypeAliasDeclaration': {
      const t = extractTypeAlias(stmt); t.isExported = isExported
      out.types.push(t)
      if (isExported && stmt.id) out.exports.push({ name: stmt.id.name, kind: 'type', line })
      break
    }
    case 'TSEnumDeclaration': {
      const t = extractEnum(stmt); t.isExported = isExported
      out.types.push(t)
      if (isExported && stmt.id) out.exports.push({ name: stmt.id.name, kind: 'type', line })
      break
    }
  }
}

// ── Iterative AST walker (for call sites + JSX) ───────────────────────────────

const SKIP = new Set(['type','loc','start','end','range','extra','trailingComments','leadingComments','innerComments'])

function walkAST(root, visitor) {
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || !node.type) continue
    visitor[node.type]?.(node)
    for (const key of Object.keys(node)) {
      if (SKIP.has(key)) continue
      const child = node[key]
      if (Array.isArray(child)) {
        for (const c of child) { if (c?.type) stack.push(c) }
      } else if (child?.type) {
        stack.push(child)
      }
    }
  }
}

// ── Full file analysis ────────────────────────────────────────────────────────

function analyzeAST(ast) {
  const out = { imports: [], exports: [], functions: [], classes: [], types: [], callSites: [], jsxComponents: new Set() }

  // Pass 1: top-level structure
  for (const stmt of (ast.program?.body ?? [])) {
    analyzeStatement(stmt, out, false)
  }

  // Pass 2: deep walk for call sites + JSX (can't be done top-level only)
  walkAST(ast.program, {
    CallExpression(node) {
      const c = node.callee, line = node.loc?.start.line ?? 0
      if (c.type === 'Identifier')
        out.callSites.push({ callee: c.name, line })
      else if (c.type === 'MemberExpression' && c.object?.type === 'Identifier')
        out.callSites.push({ callee: c.object.name, line, member: c.property?.name ?? c.property?.value })
    },
    NewExpression(node) {
      if (node.callee?.type === 'Identifier')
        out.callSites.push({ callee: node.callee.name, line: node.loc?.start.line ?? 0, isNew: true })
    },
    JSXOpeningElement(node) {
      const n = node.name
      if (n.type === 'JSXIdentifier' && /^[A-Z]/.test(n.name))
        out.jsxComponents.add(n.name)
      else if (n.type === 'JSXMemberExpression' && n.object?.type === 'JSXIdentifier')
        out.jsxComponents.add(n.object.name)
    }
  })

  return out
}

function parseFile(absPath, content) {
  try {
    const plugins = []
    if (/\.(ts|tsx)$/.test(absPath)) plugins.push('typescript')
    if (/\.(tsx|jsx)$/.test(absPath)) plugins.push('jsx')
    const ast = parse(content, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
      plugins
    })
    return analyzeAST(ast)
  } catch {
    return { imports: [], exports: [], functions: [], classes: [], types: [], callSites: [], jsxComponents: new Set() }
  }
}

// ── Skeleton builder (TypeScript declaration format for LLM) ──────────────────

function buildSkeleton(relPath, info, resolvedImports) {
  const lines = [`// ═══ ${relPath} ═══`]

  // Imports
  for (const imp of info.imports) {
    const resolved = resolvedImports.get(imp.source)
    const target = resolved ? resolved.replace(/\.(ts|tsx|js|jsx|mjs)$/, '') : imp.source
    const tag = resolved ? '' : '  // external'
    const specs = imp.specifiers
    if (specs.length === 0) {
      lines.push(`import '${target}'${tag}`)
    } else if (specs.includes('default') && specs.length === 1) {
      const local = [...imp.localNames.entries()].find(([,v]) => v === 'default')?.[0] ?? 'default'
      lines.push(`import ${local} from '${target}'${tag}`)
    } else if (specs.includes('*')) {
      const local = [...imp.localNames.entries()].find(([,v]) => v === '*')?.[0] ?? 'ns'
      lines.push(`import * as ${local} from '${target}'${tag}`)
    } else {
      const shown = specs.slice(0, 5)
      const suffix = specs.length > 5 ? ', …' : ''
      lines.push(`import { ${shown.join(', ')}${suffix} } from '${target}'${tag}`)
    }
  }

  // Types (interfaces, type aliases, enums)
  const exportedTypes = info.types.filter(t => t.isExported && t.name)
  const internalTypes = info.types.filter(t => !t.isExported && t.name)
  if (exportedTypes.length || internalTypes.length) {
    lines.push('')
    for (const t of exportedTypes)
      lines.push(`export ${t.definition}`)
    for (const t of internalTypes.slice(0, 3))
      lines.push(t.definition)
  }

  // Functions
  const fns = info.functions.filter(f => f.name)
  if (fns.length) {
    lines.push('')
    for (const fn of fns) {
      const async_ = fn.isAsync ? 'async ' : ''
      const ret = fn.returnType ? `: ${fn.returnType}` : ''
      const exported = fn.isExported ? 'export ' : ''
      lines.push(`${exported}declare ${async_}function ${fn.name}(${fn.params.join(', ')})${ret}`)
    }
  }

  // Classes
  if (info.classes.length) {
    lines.push('')
    for (const cls of info.classes) {
      const abs = cls.isAbstract ? 'abstract ' : ''
      const ext = cls.extends ? ` extends ${cls.extends}` : ''
      const impl = cls.implements.length ? ` implements ${cls.implements.join(', ')}` : ''
      const exported = cls.isExported ? 'export ' : ''
      lines.push(`${exported}${abs}class ${cls.name}${ext}${impl} {`)

      const publicProps = cls.properties.filter(p => !p.isPrivate).slice(0, 5)
      for (const p of publicProps) {
        const t = p.type ? `: ${p.type}` : ''
        lines.push(`  ${p.isStatic ? 'static ' : ''}${p.isReadonly ? 'readonly ' : ''}${p.name}${t}`)
      }
      if (publicProps.length) lines.push('')

      const publicMethods = cls.methods.filter(m => !m.isPrivate).slice(0, 10)
      for (const m of publicMethods) {
        const async_ = m.isAsync ? 'async ' : ''
        const static_ = m.isStatic ? 'static ' : ''
        const ret = m.returnType ? `: ${m.returnType}` : ''
        lines.push(`  ${static_}${async_}${m.name}(${m.params.join(', ')})${ret}`)
      }
      lines.push('}')
    }
  }

  return lines.join('\n')
}

// ── Graph builder ─────────────────────────────────────────────────────────────

async function buildGraph() {
  const files = collectFiles()

  // Pass 1: parse every file
  const fileData = new Map()
  for (const abs of files) {
    let stat
    try { stat = fs.statSync(abs) } catch { continue }
    if (stat.size > 300 * 1024) continue
    let content
    try { content = fs.readFileSync(abs, 'utf-8') } catch { continue }
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/')
    const analysis = parseFile(abs, content)
    fileData.set(rel, { abs, content, size: stat.size, ...analysis })
  }

  // Pass 2: resolve imports per file, build export index
  const exportIndex = new Map()   // exportedName → Set<relPath>
  for (const [relPath, d] of fileData) {
    for (const exp of d.exports) {
      if (!exp.name) continue
      if (!exportIndex.has(exp.name)) exportIndex.set(exp.name, new Set())
      exportIndex.get(exp.name).add(relPath)
    }
  }

  const nodes = [], edges = []
  const edgeSet = new Set()

  function addEdge(id, source, target, type, label) {
    const key = `${type}:${source}→${target}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push({ id, source, target, type, label })
  }

  // Pass 3: build nodes + all edge types
  for (const [relPath, d] of fileData) {
    const folder = path.dirname(relPath)

    // Build local scope: localVarName → resolvedRelPath
    const localScope = new Map()
    const resolvedImports = new Map() // source string → resolvedRelPath

    for (const imp of d.imports) {
      const target = resolveImport(d.abs, imp.source)
      if (!target || !fileData.has(target)) continue
      resolvedImports.set(imp.source, target)

      // Import edge
      const specLabel = imp.specifiers.length
        ? `{ ${imp.specifiers.slice(0, 3).join(', ')}${imp.specifiers.length > 3 ? ', …' : ''} }`
        : 'default'
      addEdge(`import:${relPath}→${target}`, relPath, target, 'import', specLabel)

      for (const [localName] of imp.localNames)
        localScope.set(localName, target)
    }

    // Build skeleton now that we have resolvedImports
    const skeleton = buildSkeleton(relPath, d, resolvedImports)

    nodes.push({
      id: relPath,
      folder: folder === '.' ? '' : folder,
      label: path.basename(relPath),
      size: d.size,
      content: d.content,
      exports: d.exports,
      functions: d.functions,
      classes: d.classes,
      types: d.types,
      skeleton
    })

    // Call edges
    const callEdgeNames = new Map()
    for (const { callee } of d.callSites) {
      const targetFile = localScope.get(callee)
      if (!targetFile || targetFile === relPath) continue
      if (!callEdgeNames.has(targetFile)) callEdgeNames.set(targetFile, new Set())
      callEdgeNames.get(targetFile).add(callee)
    }
    for (const [targetFile, names] of callEdgeNames) {
      const label = `calls ${[...names].slice(0, 3).join(', ')}${names.size > 3 ? ', …' : ''}`
      addEdge(`call:${relPath}→${targetFile}`, relPath, targetFile, 'call', label)
    }

    // JSX render edges
    const renderEdgeNames = new Map()
    for (const componentName of d.jsxComponents) {
      const targetFile = localScope.get(componentName)
      if (!targetFile || targetFile === relPath) continue
      if (!renderEdgeNames.has(targetFile)) renderEdgeNames.set(targetFile, new Set())
      renderEdgeNames.get(targetFile).add(componentName)
    }
    for (const [targetFile, names] of renderEdgeNames) {
      const label = `renders ${[...names].map(n => `<${n}>`).join(', ')}`
      addEdge(`renders:${relPath}→${targetFile}`, relPath, targetFile, 'renders', label)
    }
  }

  return { nodes, edges }
}

// ── HTTP server ───────────────────────────────────────────────────────────────

let cached = null, lastFetch = 0

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function normalizeGitHubUrl(raw) {
  // Accept:
  //   https://github.com/owner/repo
  //   https://github.com/owner/repo.git
  //   github.com/owner/repo
  //   owner/repo   (shorthand)
  let url = raw.trim()
  if (!url.startsWith('http')) {
    if (url.startsWith('github.com/')) url = 'https://' + url
    else if (/^[\w.-]+\/[\w.-]+$/.test(url)) url = `https://github.com/${url}`
  }
  if (!url.endsWith('.git')) url = url.replace(/\/$/, '') + '.git'
  return url
}

async function cloneRepo(repoUrl) {
  const repoName = repoUrl.split('/').pop().replace(/\.git$/, '') || 'repo'
  const dest = path.join(os.tmpdir(), `codesight-${repoName}-${Date.now()}`)

  cloneState = { status: 'cloning', message: `Cloning ${repoName}…`, repoUrl }
  console.log(`Cloning ${repoUrl} → ${dest}`)

  try {
    await execAsync(`git clone --depth 1 "${repoUrl}" "${dest}"`, { timeout: 120_000 })
  } catch (err) {
    cloneState = { status: 'error', message: err.stderr?.trim() || String(err), repoUrl }
    throw err
  }

  ROOT = dest
  cached = null
  lastFetch = 0
  buildWorkspaceMap(ROOT)
  cloneState = { status: 'ready', message: `Loaded ${repoName}`, repoUrl }
  console.log(`ROOT updated → ${ROOT}`)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // ── GET /graph ────────────────────────────────────────────────────────────
  if (req.url === '/graph' && req.method === 'GET') {
    try {
      if (!cached || Date.now() - lastFetch > 15_000) {
        console.log('Analyzing…')
        const t = Date.now()
        cached = await buildGraph()
        const imp = cached.edges.filter(e => e.type === 'import').length
        const call = cached.edges.filter(e => e.type === 'call').length
        const renders = cached.edges.filter(e => e.type === 'renders').length
        console.log(`  ${cached.nodes.length} files  |  ${imp} imports  ${call} calls  ${renders} renders  (${Date.now()-t}ms)`)
        lastFetch = Date.now()
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(cached))
    } catch (err) {
      console.error(err)
      res.writeHead(500); res.end(JSON.stringify({ error: String(err) }))
    }
    return
  }

  // ── GET /clone/status ─────────────────────────────────────────────────────
  if (req.url === '/clone/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(cloneState))
    return
  }

  // ── POST /clone ───────────────────────────────────────────────────────────
  if (req.url === '/clone' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse(await readBody(req))
    } catch {
      res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const raw = body?.url
    if (!raw || typeof raw !== 'string') {
      res.writeHead(400); res.end(JSON.stringify({ error: 'Missing url field' }))
      return
    }

    const repoUrl = normalizeGitHubUrl(raw)
    // Validate it looks like a GitHub URL
    if (!repoUrl.includes('github.com')) {
      res.writeHead(400); res.end(JSON.stringify({ error: 'Only GitHub URLs are supported' }))
      return
    }

    // Kick off async clone — respond immediately so the client can poll /clone/status
    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Clone started', url: repoUrl }))

    cloneRepo(repoUrl).catch(err => console.error('Clone failed:', err))
    return
  }

  res.writeHead(404); res.end()
})

server.listen(PORT, () => {
  console.log(`CodeSight  →  http://localhost:${PORT}`)
  console.log(`Indexing:     ${ROOT}`)
  console.log(`Webapp:       http://localhost:5173`)
  buildWorkspaceMap(ROOT)
})
