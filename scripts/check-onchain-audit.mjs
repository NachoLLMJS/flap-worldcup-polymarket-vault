import { createPublicClient, http, parseAbi, encodeAbiParameters } from 'viem';
import { bsc } from 'viem/chains';

const rpc = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const client = createPublicClient({ chain: bsc, transport: http(rpc) });
const factory = '0x35dd03331ca995e90ca6304f45d60705c596e65d';
const implementationExpected = '0xf9f63eb4c0ce81a1edd1f517b3247103867f8e04';
const portal = '0x90497450f2a706f1951b5bdda52B4E5d16f34C06';
const creator = '0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1';
const taxToken = '0x1111111111111111111111111111111111111111';
const zero = '0x0000000000000000000000000000000000000000';
const bettingVault = '0x0729614f2775b99d7825bf76405e38b10529ddb0';

const abi = parseAbi([
  'function implementation() view returns (address)',
  'function isQuoteTokenSupported(address) view returns (bool)',
  'function vaultDataSchema() view returns ((string description,(string name,string fieldType,string description,uint8 decimals)[] fields,bool isArray))',
  'function factorySpecVersion() view returns (string)',
  'function tokenCreationPolicies() view returns ((string target,string operator,bytes value,string description)[])',
  'function newVault(address taxToken,address quoteToken,address creator,bytes vaultData) returns (address)',
  'function vaultUISchema() view returns ((string vaultType,string description,(string name,string description,(string name,string fieldType,string description,uint8 decimals)[] inputs,(string name,string fieldType,string description,uint8 decimals)[] outputs,(address token,string amount,string spender)[] approvals,bool isInputArray,bool isOutputArray,bool isWriteMethod)[] methods))',
  'function description() view returns (string)',
]);
const bettingAbi = parseAbi(['function marketCount() view returns (uint256)','function worldCupViewer() view returns (address)','function guardian() view returns (address)','function operator() view returns (address)']);
const codeBytes = (code) => code === '0x' ? 0 : (code.length - 2) / 2;
const lower = (x) => String(x).toLowerCase();

const [factoryCode, implCode] = await Promise.all([
  client.getBytecode({ address: factory }),
  client.getBytecode({ address: implementationExpected }),
]);
console.log('factoryCodeBytes', codeBytes(factoryCode));
console.log('implementationCodeBytes', codeBytes(implCode));
const impl = await client.readContract({address: factory, abi, functionName:'implementation'});
console.log('implementation()', impl, lower(impl)===lower(implementationExpected) ? 'OK' : 'BAD');
console.log('isQuoteTokenSupported(BNB)', await client.readContract({address: factory, abi, functionName:'isQuoteTokenSupported', args:[zero]}));
console.log('factorySpecVersion()', await client.readContract({address: factory, abi, functionName:'factorySpecVersion'}));
const ds = await client.readContract({address: factory, abi, functionName:'vaultDataSchema'});
console.log('vaultDataSchema.description.length', ds.description.length);
console.log('vaultDataSchema.isArray', ds.isArray);
console.log('vaultDataSchema.fields', ds.fields.map(f => `${f.name}:${f.fieldType}:${f.decimals}`).join(','));
const policies = await client.readContract({address: factory, abi, functionName:'tokenCreationPolicies'});
console.log('tokenCreationPolicies.count', policies.length, policies.map(p=>`${p.target}:${p.operator}:${p.description}`).join('|'));
const ui = await client.readContract({address: implementationExpected, abi, functionName:'vaultUISchema'});
console.log('vaultUISchema.vaultType', ui.vaultType);
console.log('vaultUISchema.methodCount', ui.methods.length);
console.log('vaultUISchema.methods', ui.methods.map(m=>`${m.name}:${m.isWriteMethod?'write':'read'}:${m.outputs.length}:${m.isOutputArray?'array':'single'}`).join(','));
console.log('implementation.description.length', (await client.readContract({address: implementationExpected, abi, functionName:'description'})).length);
const vaultData = encodeAbiParameters([{type:'tuple', components:[{name:'worldCupViewer', type:'address'}, {name:'operator', type:'address'}, {name:'bettingVault', type:'address'}]}], [{worldCupViewer: zero, operator: zero, bettingVault}]);
const sim = await client.simulateContract({address: factory, abi, functionName:'newVault', account: portal, args:[taxToken, zero, creator, vaultData]});
console.log('simulate newVault from portal result', sim.result);
try {
  await client.simulateContract({address: factory, abi, functionName:'newVault', account: creator, args:[taxToken, zero, creator, vaultData]});
  console.log('simulate newVault from nonportal BAD: succeeded');
} catch(e) { console.log('simulate newVault from nonportal reverted OK:', e.shortMessage || e.message.split('\n')[0]); }
console.log('betting.marketCount', (await client.readContract({address: bettingVault, abi: bettingAbi, functionName:'marketCount'})).toString());
console.log('betting.worldCupViewer', await client.readContract({address: bettingVault, abi: bettingAbi, functionName:'worldCupViewer'}));
console.log('betting.guardian', await client.readContract({address: bettingVault, abi: bettingAbi, functionName:'guardian'}));
console.log('betting.operator', await client.readContract({address: bettingVault, abi: bettingAbi, functionName:'operator'}));
