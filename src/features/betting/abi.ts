/** Minimal ABI used by the bet slip today (placeBet + withdrawBet).
 *  The full WorldCupBettingVault ABI (claim/refund/resolveMarket/reads) lands in PR #5. */
export const bettingAbi = [
  {
    type: 'function',
    name: 'placeBet',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'teamId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawBet',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'teamId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;
