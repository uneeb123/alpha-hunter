export interface CreatePoolEvent {
  accountData: AccountData[];
  description: string;
  events: Record<string, unknown>;
  fee: number;
  feePayer: string;
  instructions: Instruction[];
  nativeTransfers: NativeTransfer[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  transactionError: null | unknown;
  type: 'CREATE_POOL';
}

interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: {
    decimals: number;
    tokenAmount: string;
  };
  tokenAccount: string;
  userAccount: string;
}

interface Instruction {
  accounts: string[];
  data: string;
  innerInstructions: InnerInstruction[];
  programId: string;
}

interface InnerInstruction {
  accounts: string[];
  data: string;
  programId: string;
}

interface NativeTransfer {
  amount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

interface TokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  mint: string;
  toTokenAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  tokenStandard: 'Fungible';
}
