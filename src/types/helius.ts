export interface HeliusTransactionMeta {
  err: null | any;
  fee: number;
  innerInstructions: Array<{
    index: number;
    instructions: Array<{
      accounts: number[];
      data: string;
      programIdIndex: number;
      stackHeight: number | null;
    }>;
  }>;
  loadedAddresses: {
    readonly: string[];
    writable: string[];
  };
  logMessages: string[];
  postBalances: number[];
  postTokenBalances: Array<{
    accountIndex: number;
    mint: string;
    owner: string;
    programId: string;
    uiTokenAmount: {
      amount: string;
      decimals: number;
      uiAmount: number | null;
      uiAmountString: string;
    };
  }>;
  preBalances: number[];
  preTokenBalances: Array<{
    accountIndex: number;
    mint: string;
    owner: string;
    programId: string;
    uiTokenAmount: {
      amount: string;
      decimals: number;
      uiAmount: number | null;
      uiAmountString: string;
    };
  }>;
  rewards: Array<{
    pubkey: string;
    lamports: number;
    postBalance: number;
    rewardType: string;
  }>;
  status: {
    Ok: null | any;
  };
  computeUnitsConsumed?: number;
}

export interface HeliusTransactionMessage {
  accountKeys: string[];
  addressTableLookups?: Array<{
    accountKey: string;
    readonlyIndexes: number[];
    writableIndexes: number[];
  }>;
  header: {
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
    numRequiredSignatures: number;
  };
  instructions: Array<{
    accounts: number[];
    data: string;
    programIdIndex: number;
    stackHeight: number | null;
  }>;
  recentBlockhash: string;
}

export interface HeliusTransaction {
  message: HeliusTransactionMessage;
  signatures: string[];
}

export interface HeliusTransactionResponse {
  blockTime: number;
  meta: HeliusTransactionMeta;
  slot: number;
  transaction: HeliusTransaction;
  version: number;
}

export interface HeliusAssetResponse {
  interface: string;
  id: string;
  content: {
    $schema: string;
    json_uri: string;
    files: Array<{
      uri: string;
      cdn_uri: string;
      mime: string;
    }>;
    metadata: {
      description: string;
      name: string;
      symbol: string;
      token_standard: string;
    };
    links: {
      image: string;
    };
  };
  authorities: Array<{
    address: string;
    scopes: string[];
  }>;
  compression: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping: any[];
  royalty: {
    royalty_model: string;
    target: null | string;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: null | string;
    ownership_model: string;
    owner: string;
  };
  supply: null | string;
  mutable: boolean;
  burnt: boolean;
  token_info: {
    supply: number;
    decimals: number;
    token_program: string;
  };
}

// Update HeliusRpcResponse to handle both transaction and asset responses
export interface HeliusRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result: HeliusTransactionResponse | HeliusAssetResponse;
  error?: {
    code: number;
    message: string;
  };
}

// API Request types
export interface HeliusTransactionConfig {
  encoding: 'json';
  maxSupportedTransactionVersion: number;
}

export interface HeliusAssetParams {
  id: string;
  displayOptions: {
    showFungible: boolean;
  };
}

export interface HeliusRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: [string, HeliusTransactionConfig] | HeliusAssetParams;
}

export interface HeliusRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result: HeliusTransactionResponse | HeliusAssetResponse;
  error?: {
    code: number;
    message: string;
  };
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  image?: string;
}

/**
 * SWAP EVENT
 */

export interface RawTokenAmount {
  decimals: number;
  tokenAmount: string;
}

export interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: RawTokenAmount;
  tokenAccount: string;
  userAccount: string;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface Instruction {
  accounts: string[];
  data: string;
  innerInstructions: {
    accounts: string[];
    data: string;
    programId: string;
  }[];
  programId: string;
}

export interface NativeTransfer {
  amount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

export interface TokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  mint: string;
  toTokenAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  tokenStandard: string;
}

export interface SwapEvent {
  accountData: AccountData[];
  description: string;
  events: Record<string, any>;
  fee: number;
  feePayer: string;
  instructions: Instruction[];
  nativeTransfers: NativeTransfer[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  transactionError: null | any;
  type: 'SWAP';
}

/**
 * Simplified swap structure that represents a token swap
 */
export interface TokenSwap {
  // Input token
  inputMint: string;
  inputAmount: number;
  inputDecimals: number;
  fromUser: string;

  // Output token
  outputMint: string;
  outputAmount: number;
  outputDecimals: number;
  toUser: string;

  // Transaction details
  signature: string;
  timestamp: number;
  source: string;
  fee: number;
  feePayer: string;
}
