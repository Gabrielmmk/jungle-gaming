import { AxiosError } from 'axios'
import type { ApiError } from '@/contracts/errors'

export interface ParsedApiError {
  message: string
  fields: Record<string, string>
}

/** Extrai mensagem geral + erros por campo de um erro do Axios/API. */
export const parseApiError = (error: unknown, fallback = 'Algo deu errado'): ParsedApiError => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ApiError>
    return { message: data.message ?? fallback, fields: data.fields ?? {} }
  }
  return { message: fallback, fields: {} }
}
