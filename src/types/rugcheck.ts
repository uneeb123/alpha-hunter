interface TokenInfo {
  mintAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

interface TokenMeta {
  name: string;
  symbol: string;
  uri: string;
  mutable: boolean;
  updateAuthority: string;
}

interface TokenHolder {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
  insider: boolean;
}

interface Risk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: string;
}

interface FileMeta {
  description: string;
  name: string;
  symbol: string;
  image: string;
}

interface TokenAccount {
  mint: string;
  owner: string;
  amount: number;
  delegate: string | null;
  state: number;
  delegatedAmount: number;
  closeAuthority: string | null;
}

interface LPInfo {
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  quotePrice: number;
  basePrice: number;
  base: number;
  quote: number;
  reserveSupply: number;
  currentSupply: number;
  quoteUSD: number;
  baseUSD: number;
  pctReserve: number;
  pctSupply: number;
  holders: any | null;
  totalTokensUnlocked: number;
  tokenSupply: number;
  lpLocked: number;
  lpUnlocked: number;
  lpLockedPct: number;
  lpLockedUSD: number;
  lpMaxSupply: number;
  lpCurrentSupply: number;
  lpTotalSupply: number;
}

interface Market {
  pubkey: string;
  marketType: string;
  mintA: string;
  mintB: string;
  mintLP: string;
  liquidityA: string;
  liquidityB: string;
  mintAAccount: TokenInfo;
  mintBAccount: TokenInfo;
  mintLPAccount: TokenInfo;
  liquidityAAccount: TokenAccount;
  liquidityBAccount: TokenAccount;
  lp: LPInfo;
}

interface TransferFee {
  pct: number;
  maxAmount: number;
  authority: string;
}

interface KnownAccount {
  name: string;
  type: string;
}

interface InsiderNetwork {
  id: string;
  size: number;
  type: string;
  tokenAmount: number;
  activeAccounts: number;
}

export interface TokenReport {
  mint: string;
  tokenProgram: string;
  creator: string;
  token: TokenInfo;
  token_extensions: any | null;
  tokenMeta: TokenMeta;
  topHolders: TokenHolder[];
  freezeAuthority: string | null;
  mintAuthority: string | null;
  risks: Risk[];
  score: number;
  score_normalised: number;
  fileMeta: FileMeta;
  lockerOwners: Record<string, any>;
  lockers: Record<string, any>;
  markets: Market[];
  totalMarketLiquidity: number;
  totalLPProviders: number;
  totalHolders: number;
  price: number;
  rugged: boolean;
  tokenType: string;
  transferFee: TransferFee;
  knownAccounts: Record<string, KnownAccount>;
  events: any[];
  verification: any | null;
  graphInsidersDetected: number;
  insiderNetworks: InsiderNetwork[];
  detectedAt: string;
  creatorTokens: any | null;
}
