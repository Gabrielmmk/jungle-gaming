import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/rest/handlers'

export const server = setupServer(...handlers)
