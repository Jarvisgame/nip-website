import { listContent } from '~~/server/utils/notion-content'

export default defineEventHandler(event => listContent(event))
