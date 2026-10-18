/**
 * Hash determinístico simples (djb2) para senhas no mock backend.
 * NÃO é criptografia real — serve apenas para não armazenar senha em texto
 * puro no estado simulado. Mesmo input → mesmo hash.
 */
export const hashPassword = (password: string): string => {
  let hash = 5381
  const salted = `greenmint:${password}`
  for (let i = 0; i < salted.length; i++) {
    hash = (hash * 33) ^ salted.charCodeAt(i)
  }
  return `h_${(hash >>> 0).toString(16)}`
}
