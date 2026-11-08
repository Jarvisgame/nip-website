import { getContentPage } from '~~/server/utils/notion-content'

export default defineEventHandler(async event => {
  const result = await getContentPage(event)

  if (!result.page) {
    throw createError({ statusCode: 404, statusMessage: 'Content not found' })
  }

  return result
})
