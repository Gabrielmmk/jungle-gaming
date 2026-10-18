export type ApiErrorCode = 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'transient'

export const HTTP_BY_CODE: Record<ApiErrorCode, number> = {
  validation: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  transient: 503,
}

export interface ApiError {
  code: ApiErrorCode
  message: string
  fields?: Record<string, string>
}
