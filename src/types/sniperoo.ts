export interface Wallet {
  id: number;
  address: string;
  name: string;
  solBalance: number;
  hidden: boolean;
}

export interface BuyTokenParams {
  tokenAddress: string;
  inputAmount: number;
  profitPercentage?: number;
  stopLossPercentage?: number;
}

interface Purchase {
  txSignature: string;
  tokenAmount: string;
  tokenAmountInUSD: string;
  tokenPriceInUSD: string;
}

export interface BuyTokenResponse {
  purchases: Purchase[];
  solPriceInUSD: string;
}

export interface SellTokenParams {
  tokenAddress: string;
  percentage?: number;
  prioritizationFeeInSolana?: number;
  slippageInPercentage?: number;
  jitoTipInSolana?: number;
}

interface SellTransaction {
  id: number;
  positionTransactionTypeEnum: string;
  transactionId: string;
  positionId: number;
  solAmount: string;
  tokenAmount: string;
  transactionDate: string;
}

export interface SellTokenResponse {
  sellTransaction: SellTransaction;
  txTimestamp: number;
}

interface Transaction {
  id: number;
  positionId: number;
  solAmount: string;
  tokenAmount: string;
  transactionDate: string;
  transactionId: string;
  positionTransactionTypeEnum: string;
}

interface TokenExtraInfo {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenImage: string;
  totalSupply: number;
}

interface Strategy {
  strategyName: string;
  profitPercentage: number;
  stopLossPercentage: number;
}

interface AutoSellSettings {
  highestPriceExpressedInUsd: string;
  strategy: Strategy;
  tokenAmountSold: string;
  initialPriceExpressedInUsd: string;
}

export interface Position {
  initialSolAmountUi: number;
  initialTokenAmountUi: number;
  transactions: Transaction[];
  tokenExtraInfo: TokenExtraInfo;
  walletAddress: string;
  id: number;
  userId: number;
  isOpen: boolean;
  createdAt: string;
  tokenAddress: string;
  initialSolAmount: string;
  initialTokenAmount: string;
  oneSolPriceInUSDAtCreation: string;
  updatedAt: string;
  autoSellSettings: AutoSellSettings;
  isPaused: boolean;
  closedAt: string | null;
  closedBy: string | null;
  oneSolPriceInUSDAtClosing: string | null;
  errorType: string | null;
  weirdErrorRetryCount: number;
  timeoutRetryCount: number;
  amountOfTokensSold: string;
}
