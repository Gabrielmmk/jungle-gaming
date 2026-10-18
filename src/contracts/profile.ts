import { z } from 'zod'

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Informe um nome de exibição'),
  username: z.string().min(3, 'O nome de usuário deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  ensName: z.string().optional(),
  walletNickname: z.string().optional(),
})
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

/** Avatar simulado como data URL; limite para não inchar o estado persistido. */
export const AVATAR_MAX_BYTES = 256 * 1024
export const avatarSchema = z.object({
  avatarUrl: z.string().nullable(),
})
export type AvatarInput = z.infer<typeof avatarSchema>
