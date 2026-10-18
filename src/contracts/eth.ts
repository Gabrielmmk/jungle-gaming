declare const brand: unique symbol;
export type EthAmount = string & { readonly [brand]: 'EthAmount' };
export const ethAmount = (s: string): EthAmount => s as EthAmount;
