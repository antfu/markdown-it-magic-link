import { expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import MarkdownItMagicLink from '../src'

it('basic', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink)

  const result = md.render([
    'Foo {@github} Bar',
    '',
    'Foo {VueUse|https://vueuse.org} Bar',
  ].join('\n'))

  expect(result)
    .toMatchInlineSnapshot(`
      "<p>Foo <a href="https://github.com/github" class="markdown-magic-link markdown-magic-link-github-at"><span class="markdown-magic-link-image" style="background-image: url('https://github.com/github.png');"></span>github</a> Bar</p>
      <p>Foo <a href="https://vueuse.org" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      "
    `)
})

it('links map', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    linksMap: {
      'VueUse': 'https://vueuse.org/1',
      'Vue Use': 'https://vueuse.org/2',
    },
  })

  const result = md.render([
    'A {VueUse} Bar',
    '',
    'B {Vue Use } Bar',
    '',
    'C {VueUse|https://vueuse.org/3} Bar',
    '',
    'D {Vueuse} non-target',
  ].join('\n'))
  expect(result)
    .toMatchInlineSnapshot(`
      "<p>A <a href="https://vueuse.org/1" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      <p>B <a href="https://vueuse.org/2" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>Vue Use</a> Bar</p>
      <p>C <a href="https://vueuse.org/3" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://favicon.yandex.net/favicon/vueuse.org');"></span>VueUse</a> Bar</p>
      <p>D {Vueuse} non-target</p>
      "
    `)
})

it('imageOverrides', () => {
  const md = MarkdownIt()
  md.use(MarkdownItMagicLink, {
    linksMap: {
      VueUse: 'https://vueuse.org/1',
    },
    imageOverrides: [
      [/^https:\/\/vueuse\.org\/1/, 'https://example.com/favicon1.png'],
      [/^https:\/\/vueuse\.org\//, 'https://example.com/favicon2.png'],
    ],
  })

  const result = md.render([
    'A {VueUse} Bar',
    '',
    'B {VueUse|https://vueuse.org/anything} Bar',
  ].join('\n'))
  expect(result)
    .toMatchInlineSnapshot(`
      "<p>A <a href="https://vueuse.org/1" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://example.com/favicon1.png');"></span>VueUse</a> Bar</p>
      <p>B <a href="https://vueuse.org/anything" class="markdown-magic-link markdown-magic-link-link"><span class="markdown-magic-link-image" style="background-image: url('https://example.com/favicon2.png');"></span>VueUse</a> Bar</p>
      "
    `)
})
