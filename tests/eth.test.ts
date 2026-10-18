import { describe, it, expect } from 'vitest'
import { addEth, mulEthByQty, formatEth, isValidEth } from '@/shared/eth/money'

describe('eth money', () => {
  it('soma mantendo precisão decimal sem float', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(addEth('1.000000000000000001', '0')).toBe('1.000000000000000001')
  })
  it('multiplica por quantidade inteira', () => {
    expect(mulEthByQty('0.015', 3)).toBe('0.045')
  })
  it('formata com símbolo e casas estáveis', () => {
    expect(formatEth('0.3')).toBe('0.3 ETH')
  })
  it('valida string decimal', () => {
    expect(isValidEth('0.1')).toBe(true)
    expect(isValidEth('abc')).toBe(false)
    expect(isValidEth('')).toBe(false)
  })
})
