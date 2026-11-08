import fs from 'node:fs'
import path from 'node:path'
import { Client } from '@notionhq/client'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (match) env[match[1]] = match[2]
}

const dataSources = {
  docs: env.NOTION_DOCS_DATA_SOURCE_ID,
  blog: env.NOTION_BLOG_DATA_SOURCE_ID
}

if (!env.NOTION_API_KEY || !dataSources.docs || !dataSources.blog) {
  throw new Error(
    'Set NOTION_API_KEY, NOTION_DOCS_DATA_SOURCE_ID and NOTION_BLOG_DATA_SOURCE_ID in .env'
  )
}

const notion = new Client({
  auth: env.NOTION_API_KEY,
  fetch: globalThis.fetch.bind(globalThis)
})

const schema = {
  docs: {
    Slug: { rich_text: {} },
    Description: { rich_text: {} },
    Locale: {
      select: {
        options: [
          { name: 'zh', color: 'orange' },
          { name: 'en', color: 'blue' }
        ]
      }
    },
    Order: { number: { format: 'number' } },
    Published: { checkbox: {} }
  },
  blog: {
    Slug: { rich_text: {} },
    Description: { rich_text: {} },
    Locale: {
      select: {
        options: [
          { name: 'zh', color: 'orange' },
          { name: 'en', color: 'blue' }
        ]
      }
    },
    Date: { date: {} },
    Tags: {
      multi_select: {
        options: [
          { name: 'NDN' },
          { name: '操作系统' },
          { name: '协议栈' },
          { name: 'Operating systems' },
          { name: 'Protocol stack' }
        ]
      }
    },
    Published: { checkbox: {} }
  }
}

function richText(content, annotations) {
  const text = String(content ?? '').replace(/\r?\n/g, ' ').trim()
  if (!text) return []
  return [
    {
      type: 'text',
      text: { content: text.slice(0, 2000) },
      ...(annotations ? { annotations } : {})
    }
  ]
}

function inlineRichText(value) {
  const source = String(value ?? '')
  const result = []
  const tokenPattern =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let cursor = 0

  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0
    if (index > cursor) {
      result.push(...richText(source.slice(cursor, index)))
    }

    const token = match[0]
    if (token.startsWith('**')) {
      result.push(
        ...richText(token.slice(2, -2), { bold: true })
      )
    } else if (token.startsWith('`')) {
      result.push(
        ...richText(token.slice(1, -1), { code: true })
      )
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (link) {
        result.push({
          type: 'text',
          text: {
            content: link[1],
            link: { url: link[2] }
          }
        })
      }
    }

    cursor = index + token.length
  }

  if (cursor < source.length) {
    result.push(...richText(source.slice(cursor)))
  }

  return result.length ? result : richText(source)
}

function block(type, content) {
  return {
    object: 'block',
    type,
    [type]: content
  }
}

function markdownToBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0
  let skippedTitle = false

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index++
      continue
    }

    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim() || 'plain text'
      const code = []
      index++
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index])
        index++
      }
      if (index < lines.length) index++
      blocks.push(
        block('code', {
          rich_text: [
            {
              type: 'text',
              text: { content: code.join('\n').slice(0, 2000) }
            }
          ],
          language:
            ['bash', 'json', 'javascript', 'typescript', 'python'].includes(
              language
            )
              ? language
              : 'plain text'
        })
      )
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      if (level === 1) {
        // The Notion page title already carries the H1.
        if (!skippedTitle) {
          skippedTitle = true
          index++
          continue
        }
      }

      blocks.push(
        block(`heading_${level === 1 ? 1 : level}`, {
          rich_text: inlineRichText(heading[2])
        })
      )
      index++
      continue
    }

    if (/^\|/.test(line) && /^\|?[\s:|-]+\|?$/.test(lines[index + 1] ?? '')) {
      const rows = []
      while (index < lines.length && /^\|/.test(lines[index])) {
        const cells = lines[index]
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(cell => cell.trim())
        if (!/^[\s:|-]+$/.test(cells.join(''))) rows.push(cells)
        index++
      }

      if (rows.length) {
        const width = Math.max(...rows.map(row => row.length))
        blocks.push(
          block('table', {
            table_width: width,
            has_column_header: true,
            has_row_header: false,
            children: rows.map(row => ({
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: Array.from(
                  { length: width },
                  (_, cellIndex) => inlineRichText(row[cellIndex] ?? '')
                )
              }
            }))
          })
        )
      }
      continue
    }

    if (line.trim().startsWith('>')) {
      const quote = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''))
        index++
      }
      blocks.push(
        block('quote', {
          rich_text: inlineRichText(quote.join('\n'))
        })
      )
      continue
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line)
    if (bullet) {
      blocks.push(
        block('bulleted_list_item', {
          rich_text: inlineRichText(bullet[1])
        })
      )
      index++
      continue
    }

    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (numbered) {
      blocks.push(
        block('numbered_list_item', {
          rich_text: inlineRichText(numbered[1])
        })
      )
      index++
      continue
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push(block('divider', {}))
      index++
      continue
    }

    const paragraph = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^\s*[-*+]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith('>') &&
      !lines[index].trim().startsWith('```') &&
      !/^\|/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index++
    }

    if (paragraph.length) {
      blocks.push(
        block('paragraph', {
          rich_text: inlineRichText(paragraph.join('\n'))
        })
      )
    }
  }

  return blocks
}

function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source)
  if (!match) return { meta: {}, body: source }

  const meta = {}
  let currentKey = ''
  for (const line of match[1].split(/\r?\n/)) {
    const keyValue = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line)
    if (keyValue) {
      currentKey = keyValue[1]
      const value = keyValue[2].trim()
      if (value) meta[currentKey] = value.replace(/^['"]|['"]$/g, '')
      continue
    }

    const listItem = /^\s*-\s*(.*)$/.exec(line)
    if (listItem && currentKey === 'tags') {
      meta.tags = meta.tags ?? []
      meta.tags.push(listItem[1].trim())
    }
  }

  return { meta, body: match[2] }
}

function propertyValue(properties, name, type) {
  const property = properties[name]
  if (!property || property.type !== type) return ''
  if (type === 'rich_text') {
    return property.rich_text?.map(part => part.plain_text).join('') ?? ''
  }
  if (type === 'select') return property.select?.name ?? ''
  return ''
}

async function addMissingProperties(dataSourceId, properties) {
  const dataSource = await notion.dataSources.retrieve({
    data_source_id: dataSourceId
  })
  const existing = dataSource.properties ?? {}
  const update = {}

  for (const [name, definition] of Object.entries(properties)) {
    if (!existing[name]) update[name] = definition
  }

  if (Object.keys(update).length) {
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: update
    })
    console.log(
      `Added ${Object.keys(update).join(', ')} to data source ${dataSourceId}`
    )
  } else {
    console.log(`Data source ${dataSourceId} already has all NIP properties`)
  }
}

async function listExistingPages(dataSourceId) {
  const existing = new Set()
  let cursor

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {})
    })

    for (const page of response.results) {
      if (page.object !== 'page') continue
      const slug = propertyValue(page.properties ?? {}, 'Slug', 'rich_text')
      const locale = propertyValue(page.properties ?? {}, 'Locale', 'select')
      if (slug && locale) existing.add(`${locale}:${slug}`)
    }

    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return existing
}

async function createPages(collection, dataSourceId, files, titleProperty) {
  const existing = await listExistingPages(dataSourceId)

  for (const file of files) {
    const source = fs.readFileSync(file.path, 'utf8')
    const { meta, body } = parseFrontmatter(source)
    const slug = path.basename(file.path, '.md')
    const key = `${file.locale}:${slug}`

    if (existing.has(key)) {
      console.log(`Skip existing ${collection} ${key}`)
      continue
    }

    const properties = {
      [titleProperty]: {
        title: richText(meta.title || slug)
      },
      Slug: { rich_text: richText(slug) },
      Description: { rich_text: richText(meta.description || '') },
      Locale: { select: { name: file.locale } },
      Published: { checkbox: true }
    }

    if (collection === 'docs') {
      properties.Order = {
        number: Number(meta.order || 99)
      }
    } else {
      properties.Date = meta.date
        ? { date: { start: meta.date } }
        : { date: null }
      properties.Tags = {
        multi_select: (meta.tags ?? []).map(name => ({ name }))
      }
    }

    const page = await notion.pages.create({
      parent: {
        type: 'data_source_id',
        data_source_id: dataSourceId
      },
      properties,
      children: markdownToBlocks(body)
    })

    console.log(`Created ${collection} ${key}: ${page.id}`)
    await new Promise(resolve => setTimeout(resolve, 350))
  }
}

function listCollectionFiles(collection) {
  const files = []
  for (const locale of ['zh', 'en']) {
    const dir = path.join('content', collection, locale)
    if (!fs.existsSync(dir)) continue

    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.md')) {
        files.push({ path: path.join(dir, name), locale })
      }
    }
  }
  return files
}

async function main() {
  await addMissingProperties(dataSources.docs, schema.docs)
  await addMissingProperties(dataSources.blog, schema.blog)

  const docsSource = await notion.dataSources.retrieve({
    data_source_id: dataSources.docs
  })
  const blogSource = await notion.dataSources.retrieve({
    data_source_id: dataSources.blog
  })
  const titlePropertyFor = source =>
    Object.entries(source.properties ?? {}).find(
      ([, property]) => property.type === 'title'
    )?.[0]

  const docsTitleProperty = titlePropertyFor(docsSource)
  const blogTitleProperty = titlePropertyFor(blogSource)

  if (!docsTitleProperty || !blogTitleProperty) {
    throw new Error('Could not find the title property on both data sources')
  }

  await createPages(
    'docs',
    dataSources.docs,
    listCollectionFiles('docs'),
    docsTitleProperty
  )
  await createPages(
    'blog',
    dataSources.blog,
    listCollectionFiles('blog'),
    blogTitleProperty
  )
}

await main()
