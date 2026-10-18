import Big from 'big.js'
import { type EthAmount, ethAmount } from '@/contracts/eth'

Big.DP = 18 // casas decimais do ETH (wei)
Big.RM = Big.roundHalfUp

export const isValidEth = (s: string): boolean => {
  if (!s) return false
  try {
    new Big(s)
    return true
  } catch {
    return false
  }
}

export const addEth = (a: string, b: string): EthAmount => ethAmount(new Big(a).plus(b).toString())

export const subEth = (a: string, b: string): EthAmount => ethAmount(new Big(a).minus(b).toString())

export const mulEthByQty = (a: string, qty: number): EthAmount =>
  ethAmount(new Big(a).times(qty).toString())

export const formatEth = (a: string): string => `${new Big(a).toString()} ETH`
