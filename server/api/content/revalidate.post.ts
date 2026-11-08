import { revalidateContent } from '~~/server/utils/notion-content'

export default defineEventHandler(async event => {
  const purged = await revalidateContent(event)
  return { ok: true, purged }
})
