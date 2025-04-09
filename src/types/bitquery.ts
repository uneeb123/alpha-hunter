export interface BitQueryResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations: Array<{ line: number; column: number }>;
  }>;
}

interface ProgramArgument {
  Name: string;
  Type: string;
  Value: {
    json?: any;
    float?: number;
    bool?: boolean;
    hex?: string;
    bigInteger?: string;
    address?: string;
    string?: string;
    integer?: number;
  };
}

interface TokenInfo {
  Mint?: string;
  Owner?: string;
  ProgramId?: string;
}

interface AccountInfo {
  Address: string;
  IsWritable: boolean;
  Token?: TokenInfo;
}

interface InstructionProgram {
  Address: string;
  Name?: string;
  Method: string;
  Arguments: ProgramArgument[];
  AccountNames?: string[];
  Json?: any;
}

interface TransactionResult {
  Success: boolean;
  ErrorMessage?: string;
}

interface Transaction {
  Fee: number;
  FeeInUSD: number;
  Signature: string;
  Signer: string;
  FeePayer: string;
  Result: TransactionResult;
}

interface Block {
  Time: string;
  Height: number;
}

interface Instruction {
  Program: InstructionProgram;
  Accounts: AccountInfo[];
  Logs: string[];
  BalanceUpdatesCount: number;
  AncestorIndexes: number[];
  CallPath: number[];
  CallerIndex: number;
  Data: string;
  Depth: number;
  ExternalSeqNumber: number;
  Index: number;
  InternalSeqNumber: number;
  TokenBalanceUpdatesCount: number;
}

export interface PumpSwapPool {
  Instruction: Instruction;
  Transaction: Transaction;
  Block: Block;
}

export interface PumpSwapPoolsResponse {
  Solana: {
    Instructions: PumpSwapPool[];
  };
}

export interface GraduatedToken {
  creator: string;
  success: boolean;
  pump_token: string;
  lp_token: string;
  creation_time: string;
}
