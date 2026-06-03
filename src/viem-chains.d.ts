declare module 'viem/chains' {
  export const bsc: any;
}

declare module 'viem' {
  export function createWalletClient(config: any): any;
  export function createPublicClient(config: any): any;
  export function custom(provider: any): any;
  export function http(url?: string): any;
  export function parseEther(value: string): bigint;
  export function formatEther(value: bigint): string;
}
