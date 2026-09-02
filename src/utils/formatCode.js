function splitTop(s, sep) {
  let d = 0, par = 0, start = 0
  const parts = []
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(' || ch === '[') par++
    else if (ch === ')' || ch === ']') par--
    else if (ch === '{') d++
    else if (ch === '}') d--
    else if (ch === sep && par === 0 && d === 0) {
      parts.push(s.slice(start, i + 1))
      start = i + 1
    }
  }
  parts.push(s.slice(start))
  return parts.map(p => p.trim()).filter(Boolean)
}

function expandStmt(st) {
  const ci = st.indexOf('{')
  const cj = st.lastIndexOf('}')
  if (ci === -1) return st
  const head = st.slice(0, ci).trim()
  const body = st.slice(ci + 1, cj).trim()
  const tail = st.slice(cj + 1).trim()
  const bodyStmts = splitTop(body, ';').map(b => '  ' + b)
  return head + ' {\n' + bodyStmts.join('\n') + '\n}' + (tail ? ' ' + tail : '')
}

function formatStatements(s) {
  return splitTop(s, ';').map(expandStmt).join('\n')
}

function formatObjectCall(s) {
  const oi = s.indexOf('{')
  const lastCj = s.lastIndexOf('}')
  const prefix = s.slice(0, oi + 1)
  const inner = s.slice(oi + 1, lastCj).trim()
  const suffix = s.slice(lastCj + 1).trim()
  const items = splitTop(inner, ',')
  const lines = items.map((it, i) => {
    const comma = i < items.length - 1 ? ',' : ''
    return '  ' + it.trim().replace(/,$/, '') + comma
  })
  return prefix + '\n' + lines.join('\n') + '\n}' + suffix
}

export function formatOptionCode(s) {
  if (typeof s !== 'string' || s.length === 0) return s
  const hasBlock = s.includes('{')
  const isStatementBlock = /(for|while|if)\s*\(/.test(s) && hasBlock && s.includes(';')
  const isObjectCall = /^[A-Za-z_$][\w$.]*\(\{/.test(s) && s.includes('function')
  if (isStatementBlock) return formatStatements(s)
  if (isObjectCall) return formatObjectCall(s)
  return s
}