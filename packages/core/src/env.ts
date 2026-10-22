export const VARIABLE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export interface EnvEntry {
  key: string
  value: string
}

export type EnvParseErrorCode =
  | 'missingEquals'
  | 'invalidKey'
  | 'unclosedDoubleQuote'
  | 'unclosedSingleQuote'
  | 'trailingText'
  | 'duplicateKey'
  | 'invalidJson'
  | 'expectedObject'
  | 'invalidValueType'

/** Errors carry a code and params, not text, so each UI can translate them. */
export interface EnvParseError {
  /** 1-based line, or 0 when the error is not tied to a line (JSON). */
  line: number
  code: EnvParseErrorCode
  params?: Record<string, string | number>
}

export interface EnvParseResult {
  entries: EnvEntry[]
  errors: EnvParseError[]
}

export function isValidVariableKey(key: string): boolean {
  return VARIABLE_KEY_PATTERN.test(key)
}

/**
 * Parses `.env` text. Supports comments, `export ` prefixes, unquoted,
 * single-quoted (literal) and double-quoted values (with escapes and
 * multi-line content). Duplicate keys are reported as errors.
 */
export function parseEnv(text: string): EnvParseResult {
  const entries: EnvEntry[] = []
  const errors: EnvParseError[] = []
  const seen = new Map<string, number>()
  const lines = text.replace(/\r\n?/g, '\n').split('\n')

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    const line = lines[i]!.trim()
    if (line === '' || line.startsWith('#')) continue

    const body = line.startsWith('export ') ? line.slice(7).trimStart() : line
    const eq = body.indexOf('=')
    if (eq === -1) {
      errors.push({ line: lineNumber, code: 'missingEquals' })
      continue
    }

    const key = body.slice(0, eq).trim()
    if (!isValidVariableKey(key)) {
      errors.push({ line: lineNumber, code: 'invalidKey', params: { key } })
      continue
    }

    let rest = body.slice(eq + 1).trimStart()
    let value: string

    if (rest.startsWith('"')) {
      // Double-quoted: may span several lines until the closing quote.
      let buffer = rest.slice(1)
      let closed = findClosingQuote(buffer)
      while (closed === -1 && i + 1 < lines.length) {
        i++
        buffer += '\n' + lines[i]
        closed = findClosingQuote(buffer)
      }
      if (closed === -1) {
        errors.push({ line: lineNumber, code: 'unclosedDoubleQuote' })
        continue
      }
      const trailing = buffer.slice(closed + 1).trim()
      if (trailing !== '' && !trailing.startsWith('#')) {
        errors.push({ line: lineNumber, code: 'trailingText' })
        continue
      }
      value = unescapeDoubleQuoted(buffer.slice(0, closed))
    } else if (rest.startsWith("'")) {
      const closed = rest.indexOf("'", 1)
      if (closed === -1) {
        errors.push({ line: lineNumber, code: 'unclosedSingleQuote' })
        continue
      }
      value = rest.slice(1, closed)
    } else {
      const comment = rest.search(/\s#/)
      if (comment !== -1) rest = rest.slice(0, comment)
      value = rest.trim()
    }

    const previous = seen.get(key)
    if (previous !== undefined) {
      errors.push({ line: lineNumber, code: 'duplicateKey', params: { key, previous } })
      continue
    }
    seen.set(key, lineNumber)
    entries.push({ key, value })
  }

  return { entries, errors }
}

function findClosingQuote(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++
      continue
    }
    if (text[i] === '"') return i
  }
  return -1
}

function unescapeDoubleQuoted(text: string): string {
  return text.replace(/\\(.)/gs, (_, char: string) => {
    switch (char) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      default:
        return char
    }
  })
}

function escapeDoubleQuoted(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

export function formatEnvLine(entry: EnvEntry): string {
  return `${entry.key}="${escapeDoubleQuoted(entry.value)}"`
}

export function serializeEnv(entries: EnvEntry[]): string {
  return entries.map(formatEnvLine).join('\n') + (entries.length ? '\n' : '')
}

export function entriesToJson(entries: EnvEntry[]): string {
  const object: Record<string, string> = {}
  for (const entry of entries) object[entry.key] = entry.value
  return JSON.stringify(object, null, 2)
}

/** Parses a flat JSON object. Numbers and booleans are coerced to strings. */
export function parseJsonEnv(text: string): EnvParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { entries: [], errors: [{ line: 0, code: 'invalidJson', params: { detail: (error as Error).message } }] }
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { entries: [], errors: [{ line: 0, code: 'expectedObject' }] }
  }

  const entries: EnvEntry[] = []
  const errors: EnvParseError[] = []
  for (const [key, raw] of Object.entries(data)) {
    if (!isValidVariableKey(key)) {
      errors.push({ line: 0, code: 'invalidKey', params: { key } })
      continue
    }
    if (typeof raw === 'string') entries.push({ key, value: raw })
    else if (typeof raw === 'number' || typeof raw === 'boolean') entries.push({ key, value: String(raw) })
    else errors.push({ line: 0, code: 'invalidValueType', params: { key } })
  }
  return { entries, errors }
}
