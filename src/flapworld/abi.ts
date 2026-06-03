/* WorldCupBettingVault ABI — the subset the UI needs.
   Writes: placeBet / withdrawBet / claim.  Reads: getUserBet / claimable.
   (getMarket returns a rich struct with per-outcome pools; omitted until the
   UI shows live pools — pools are currently empty on-chain.) */
export const bettingAbi = [
  {
    type: 'function', name: 'placeBet', stateMutability: 'payable',
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'teamId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'withdrawBet', stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'teamId', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'claim', stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'getUserBet', stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'user', type: 'address' }, { name: 'teamId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'claimable', stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
