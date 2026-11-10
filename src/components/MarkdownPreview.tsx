import type { ReactNode } from 'react'
import './MarkdownPreview.css'

function renderInline(source: string): ReactNode[] {
  const tokenPattern = /(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  return source.split(tokenPattern).filter(Boolean).map((token, index) => {
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index}>{token.slice(1, -1)}</code>
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={index}>{token.slice(1, -1)}</em>
    }
    return token
  })
}

export function MarkdownPreview({ value, emptyText = '暂无内容' }: { value: string; emptyText?: string }) {
  if (!value.trim()) return <div className="markdown-preview-empty">{emptyText}</div>

  const lines = value.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let code: string[] = []
  let inCode = false

  const flushParagraph = () => {
    if (paragraph.length) {
      nodes.push(<p key={`p-${nodes.length}`}>{renderInline(paragraph.join(' '))}</p>)
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`}>
          {list.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
        </ul>
      )
      list = []
    }
  }

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      flushParagraph()
      flushList()
      if (inCode) {
        nodes.push(<pre key={`code-${nodes.length}`}><code>{code.join('\n')}</code></pre>)
        code = []
        inCode = false
      } else {
        inCode = true
      }
      return
    }
    if (inCode) {
      code.push(line)
      return
    }
    if (!line.trim()) {
      flushParagraph()
      flushList()
      return
    }
    if (/^---+$/.test(line.trim())) {
      flushParagraph()
      flushList()
      nodes.push(<hr key={`hr-${index}`} />)
      return
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const content = renderInline(heading[2])
      if (heading[1].length === 1) nodes.push(<h2 key={`h-${index}`}>{content}</h2>)
      else if (heading[1].length === 2) nodes.push(<h3 key={`h-${index}`}>{content}</h3>)
      else nodes.push(<h4 key={`h-${index}`}>{content}</h4>)
      return
    }
    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      nodes.push(<blockquote key={`bq-${index}`}>{renderInline(line.slice(2))}</blockquote>)
      return
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      list.push(bullet[1])
      return
    }
    flushList()
    paragraph.push(line.trim())
  })

  flushParagraph()
  flushList()
  if (inCode) nodes.push(<pre key="code-unclosed"><code>{code.join('\n')}</code></pre>)

  return <div className="markdown-preview">{nodes}</div>
}
