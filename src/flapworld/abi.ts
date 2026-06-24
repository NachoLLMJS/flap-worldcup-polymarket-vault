/* WorldCupBettingVault ABI — the subset the UI needs.
   Writes: placeBet / withdrawBet / claim / resolveMarket / claimTaxRewards / claimEpochTaxRewards.
   Reads: getMarket / getUserBet / claimable / claimableTaxRewards / getUserBettingStats. */
export const bettingAbi = [
  {
    type: 'event', name: 'BetPlaced', anonymous: false,
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'teamId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'BetWithdrawn', anonymous: false,
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'teamId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
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
  {
    type: 'function', name: 'claimed', stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'claimTaxRewards', stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function', name: 'claimEpochTaxRewards', stateMutability: 'nonpayable',
    inputs: [{ name: 'epoch', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'claimableTaxRewards', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'currentEpoch', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'totalTaxRewardsReceived', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'getUserBettingStats', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalUserWagered', type: 'uint256' },
      { name: 'activeBets', type: 'uint256' },
      { name: 'lastMarketId', type: 'uint256' },
      { name: 'lastTeamId', type: 'uint256' },
      { name: 'lastTimestamp', type: 'uint256' },
      { name: 'previousEpochClaimable', type: 'uint256' },
    ],
  },
  {
    type: 'function', name: 'getTopBettors', stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'wallets', type: 'address[]' },
      { name: 'wagered', type: 'uint256[]' },
      { name: 'activeBets', type: 'uint256[]' },
      { name: 'lastMarketIds', type: 'uint256[]' },
      { name: 'lastTeamIds', type: 'uint256[]' },
      { name: 'lastTimestamps', type: 'uint256[]' },
    ],
  },
  {
    type: 'function', name: 'getEpochTopBettors', stateMutability: 'view',
    inputs: [{ name: 'epoch', type: 'uint256' }],
    outputs: [
      { name: 'wallets', type: 'address[]' },
      { name: 'wagered', type: 'uint256[]' },
      { name: 'bonusBps', type: 'uint256[]' },
      { name: 'weightedWagers', type: 'uint256[]' },
    ],
  },
  {
    type: 'function', name: 'getMarketTopBettors', stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'wallets', type: 'address[]' },
      { name: 'wagered', type: 'uint256[]' },
      { name: 'lastTeamIds', type: 'uint256[]' },
      { name: 'lastTimestamps', type: 'uint256[]' },
    ],
  },
] as const;
