import { formatOptionCode } from '../utils/formatCode'

export default function OptionText({ value }) {
  const s = value || ''
  const isCode =
    s.includes('\n') ||
    s.includes('(') ||
    s.includes(';') ||
    s.includes('=') ||
    s.includes('`') ||
    s.includes('=>') ||
    s.includes('function')
  if (!isCode) return <span className="option-text">{s}</span>
  return (
    <pre className="option-code"><code>{formatOptionCode(s)}</code></pre>
  )
}
