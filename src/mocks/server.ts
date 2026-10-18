import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/rest/handlers'
import { socketHandler } from '@/mocks/socket/handlers'

export const server = setupServer(...handlers, socketHandler)
