import { createPublicClient, createWalletClient, http, isAddress, getAddress } from 'viem';
import { bsc } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const RPC_URL = process.env.BSC_RPC_URL || process.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const BETTING_VAULT = getAddress(process.env.BETTING_VAULT_ADDRESS || process.env.VITE_BETTING_VAULT_ADDRESS || '0x6013Cdc9A6300CE133B418283bBfe206B0aE858d');
const TOKEN_ADDRESS_RAW = process.env.POLYFLAP_TOKEN_ADDRESS || process.env.VITE_FLAP_TOKEN_ADDRESS || process.argv[2];
const PRIVATE_KEY_RAW = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

if (!TOKEN_ADDRESS_RAW || !isAddress(TOKEN_ADDRESS_RAW)) {
  throw new Error('Set POLYFLAP_TOKEN_ADDRESS=0x... or pass the token address as argv[2]');
}
if (!PRIVATE_KEY_RAW) {
  throw new Error('Set PRIVATE_KEY in the shell for this command only. Do not write it to .env files.');
}

const TOKEN_ADDRESS = getAddress(TOKEN_ADDRESS_RAW);
const PRIVATE_KEY = PRIVATE_KEY_RAW.startsWith('0x') ? PRIVATE_KEY_RAW : `0x${PRIVATE_KEY_RAW}`;

const abi = [
  { type: 'function', name: 'polyflapToken', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'operator', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'guardian', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'setPolyflapToken', stateMutability: 'nonpayable', inputs: [{ name: 'newPolyflapToken', type: 'address' }], outputs: [] },
];

const publicClient = createPublicClient({ chain: bsc, transport: http(RPC_URL) });
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain: bsc, transport: http(RPC_URL) });

console.log(`Betting vault: ${BETTING_VAULT}`);
console.log(`Token to set: ${TOKEN_ADDRESS}`);
console.log(`Signer: ${account.address}`);

const [current, operator, guardian] = await Promise.all([
  publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'polyflapToken' }),
  publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'operator' }),
  publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'guardian' }),
]);

console.log(`Current polyflapToken: ${current}`);
console.log(`Operator: ${operator}`);
console.log(`Guardian: ${guardian}`);

if (current !== '0x0000000000000000000000000000000000000000') {
  if (getAddress(current) === TOKEN_ADDRESS) {
    console.log('Already set to the requested token. No tx sent.');
    process.exit(0);
  }
  throw new Error(`polyflapToken already set to ${current}; contract forbids changing it.`);
}

const signer = getAddress(account.address);
if (signer !== getAddress(operator) && signer !== getAddress(guardian)) {
  throw new Error(`Signer ${signer} is neither operator nor guardian; transaction would revert.`);
}

const { request } = await publicClient.simulateContract({
  account,
  address: BETTING_VAULT,
  abi,
  functionName: 'setPolyflapToken',
  args: [TOKEN_ADDRESS],
});

const hash = await walletClient.writeContract(request);
console.log(`setPolyflapToken tx: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
console.log(`Status: ${receipt.status}`);
console.log(`Block: ${receipt.blockNumber}`);

const after = await publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'polyflapToken' });
console.log(`Readback polyflapToken: ${after}`);
if (getAddress(after) !== TOKEN_ADDRESS) {
  throw new Error('Readback mismatch after transaction.');
}
console.log('Done.');
