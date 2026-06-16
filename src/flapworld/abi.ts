/* WorldCupBettingVault ABI — the subset the UI needs.
   Writes: placeBet / withdrawBet / claim / resolveMarket.
   Reads: getMarket / getUserBet / claimable. */
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
    type: 'function', name: 'resolveMarket', stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: 'winningTeamId', type: 'uint256' }, { name: 'teamName', type: 'string' }],
  },
  {
    type: 'function', name: 'getMarket', stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'view_', type: 'tuple', components: [
        { name: 'market', type: 'tuple', components: [
          { name: 'marketId', type: 'uint256' },
          { name: 'viewerMatchId', type: 'uint256' },
          { name: 'marketType', type: 'uint8' },
          { name: 'label', type: 'string' },
          { name: 'openTime', type: 'uint64' },
          { name: 'closeTime', type: 'uint64' },
          { name: 'resolveAfter', type: 'uint64' },
          { name: 'status', type: 'uint8' },
          { name: 'winningTeamId', type: 'uint256' },
          { name: 'totalPool', type: 'uint256' },
          { name: 'feeBps', type: 'uint256' },
        ]},
        { name: 'outcomeTeamIds', type: 'uint256[]' },
        { name: 'outcomePools', type: 'uint256[]' },
      ]},
    ],
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
