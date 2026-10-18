import { z } from 'zod'

/**
 * Shape único do usuário autenticado, reusado por GET /session e GET /profile
 * (o perfil não é um superset nesta camada). Senha nunca trafega aqui.
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string(),
  ensName: z.string().optional(),
  walletNickname: z.string().optional(),
  avatarUrl: z.string().optional(),
})
export type User = z.infer<typeof userSchema>

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
  displayName: z.string().min(1, 'Informe um nome de exibição'),
  username: z.string().min(3, 'O nome de usuário deve ter ao menos 3 caracteres'),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
})
export type AuthResponse = z.infer<typeof authResponseSchema>
