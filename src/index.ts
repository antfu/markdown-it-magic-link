import type MarkdownIt from 'markdown-it'

const reCapture = /^\{([^\{\}\n]*?)\}([^\[\]\{\}\(\)]|$)/i
const reHtmlProtocol = /^https?:\/\//i
const reGitHubScope = /^(?:https?:\/\/)?github\.com\/([^/]*?)(?:$|\/)/

export interface ParsedMagicLink {
  text?: string
  link: string
  type?: string
  class?: string[]
  imageUrl?: string
}

export interface ResolvedMagicLink extends Required<ParsedMagicLink> {}

export interface MagicLinkHandler {
  name: string
  handler: (content: string) => ParsedMagicLink | void | false
  postprocess?: (parsed: ResolvedMagicLink) => ResolvedMagicLink | void
}

export interface MarkdownItMagicLinkOptions {
  handlers?: MagicLinkHandler[]
}

export function handlerLink(): MagicLinkHandler {
  return {
    name: 'link',
    handler(content: string) {
      const parts = content.split('|').map(i => i.trim())
      let text = parts.length > 1 ? parts[0] : undefined
      const url = parts.length > 1 ? parts[1] : parts[0]
      const type = 'link'

      if (!url.match(/^https?:\/\//))
        return false

      text ||= url.replace(reHtmlProtocol, '')

      return {
        text,
        link: url,
        type,
        imageUrl: `https://favicon.yandex.net/favicon/${new URL(url || '').hostname}`,
      }
    },
  }
}

export function handlerGitHubAt(): MagicLinkHandler {
  return {
    name: 'github-at',
    handler(content: string) {
      const parts = content.split('|').map(i => i.trim())
      const text = parts.length > 1 ? parts[0] : undefined
      const body = parts.length > 1 ? parts[1] : parts[0]

      if (!body.match(/^@/))
        return false

      const login = body.slice(1)
      return {
        text: text || login,
        link: `https://github.com/${login}`,
        type: 'github-at',
        imageUrl: `https://github.com/${login}.png`,
      }
    },
    postprocess(parsed: ResolvedMagicLink) {
      if (parsed.link.match(reGitHubScope) && parsed.type !== 'github-at')
        parsed.imageUrl = `https://github.com/${parsed.link.match(reGitHubScope)![1]}.png`
    },
  }
}

export function parseMagicLink(content: string, handlers: MagicLinkHandler[]) {
  for (const handler of handlers) {
    const parsed = handler.handler(content)
    if (parsed)
      return parsed
  }
  return false
}

export default function MarkdownItMagicLink(md: MarkdownIt, options: MarkdownItMagicLinkOptions = {}) {
  const {
    handlers = [
      handlerLink(),
      handlerGitHubAt(),
    ],
  } = options

  md.inline.ruler.before('text', 'magic-link', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== '{'.charCodeAt(0))
      return false

    const starts = state.src.slice(state.pos)
    const match = starts.match(reCapture)
    if (!match)
      return false

    const fullMatch = match[0]
    const tailingChar = match[2]

    const parsed = parseMagicLink(match[1], handlers)
    if (!parsed)
      return false

    let resolved = {
      class: [],
      ...parsed,
    } as ResolvedMagicLink

    resolved.link = state.md.normalizeLink(parsed.link)
    resolved.class.push('markdown-magic-link', `markdown-magic-link-${parsed.type}`)
    resolved.text ||= resolved.link.replace(reHtmlProtocol, '')
    resolved.imageUrl ||= `https://favicon.yandex.net/favicon/${new URL(resolved.link || '').hostname}`

    for (const handler of handlers)
      resolved = handler.postprocess?.(resolved) || resolved

    if (!silent) {
      const token_o = state.push('link_open', 'a', 1)
      token_o.attrs = [
        ['href', resolved.link],
        ['class', resolved.class.join(' ')],
      ]
      token_o.info = 'auto'

      const token_i = state.push('html_inline', '', 0)
      token_i.content = `<span class="markdown-magic-link-image" style="background-image: url('${resolved.imageUrl}');"></span>`

      const token_t = state.push('text', '', 0)
      token_t.content = resolved.text

      const token_c = state.push('link_close', 'a', -1)
      token_c.info = 'auto'
    }

    state.pos += fullMatch.length - tailingChar.length
    return true
  })
}
