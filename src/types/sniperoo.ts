export interface Wallet {
  address: string;
  solBalance: number;
  isVisible: boolean;
  lastUpdated: string;
}

export interface BuyTokenParams {
  tokenAddress: string;
  inputAmount: number;
  profitPercentage?: number;
  stopLossPercentage?: number;
  slippageInPercentage?: number;
  prioritizationFeeInSolana?: number;
  jitoTipInSolana?: number;
}

export interface BuyTokenResponse {
  transactionId: string;
  tokenAddress: string;
  solAmount: number;
  tokenAmount: number;
  transactionDate: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface SellTokenParams {
  tokenAddress: string;
  percentage?: number;
  slippageInPercentage?: number;
  prioritizationFeeInSolana?: number;
  jitoTipInSolana?: number;
}

export interface SellTokenResponse {
  transactionId: string;
  tokenAddress: string;
  solAmount: number;
  tokenAmount: number;
  transactionDate: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Purchase {
  txSignature: string;
  tokenAmount: string;
  tokenAmountInUSD: string;
  tokenPriceInUSD: string;
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
