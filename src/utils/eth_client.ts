/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getSecrets } from './secrets';
import { erc20Abi } from './abis/erc20';
import { WETH } from './constants';
import { MoralisClient } from './moralis_client';
import type { MoralisTokenBalance } from '@/types';
import { TradeType, Percent, Token, CurrencyAmount } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';
import {
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from '@uniswap/universal-router-sdk';

export class EthClient {
  private publicClient;
  private walletClient;
  private account;
  private moralisClient: MoralisClient;
  private universalRouterAddress: `0x${string}`;

  constructor() {
    const secrets = getSecrets();
    const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${secrets.alchemyApiKey}`;

    // Initialize the account from private key
    this.account = privateKeyToAccount(secrets.ethPrivateKey as `0x${string}`);

    // Initialize the public client with Alchemy on Base
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    });

    // Initialize the wallet client
    this.walletClient = createWalletClient({
      account: this.account,
      chain: base,
      transport: http(rpcUrl),
    });

    // Initialize Moralis client
    this.moralisClient = MoralisClient.getInstance();

    this.universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(
      UniversalRouterVersion.V1_2,
      base.id,
    ) as `0x${string}`;
  }

  /**
   * Get ETH balance for an address
   * @param address The address to check balance for. If not provided, uses the client's address
   * @returns The balance in ETH as a formatted string
   */
  public async getEthBalance(address?: `0x${string}`): Promise<string> {
    const targetAddress = address || this.account.address;
    const balance = await this.publicClient.getBalance({
      address: targetAddress,
    });
    return formatEther(balance);
  }

  /**
   * Get ERC20 token balances for an address using Moralis
   * @param address The address to check balances for. If not provided, uses the client's address
   * @returns Array of token balances
   */
  public async getTokenBalances(
    address?: `0x${string}`,
  ): Promise<MoralisTokenBalance[]> {
    const targetAddress = address || this.account.address;
    return this.moralisClient.getERC20Balances(targetAddress);
  }

  /**
   * Buy tokens with WETH
   * @param tokenOut The address of the token to buy
   * @param amountIn The amount of WETH to spend (in wei)
   */
  public async buy(
    tokenOut: `0x${string}`,
    amountIn: bigint,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
  }> {
    return this.swap(WETH, tokenOut, amountIn);
  }

  /**
   * Sell tokens for WETH
   * @param tokenIn The address of the token to sell
   * @param amountIn The amount of tokens to sell (in wei)
   * @param amountOutMinimum The minimum amount of WETH to receive (in wei)
   */
  public async sell(
    tokenIn: `0x${string}`,
    amountIn: bigint,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
  }> {
    return this.swap(tokenIn, WETH, amountIn);
  }

  /**
   * Swaps tokens using Universal Router on Base
   * @param tokenIn The address of the token to swap from
   * @param tokenOut The address of the token to swap to
   * @param amountIn The amount of tokenIn to swap (in wei)
   */
  public async swap(
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    amountIn: bigint,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
  }> {
    try {
      // First approve the router to spend tokens
      const tokenApprovalHash = await this.walletClient.writeContract({
        address: tokenIn,
        abi: erc20Abi,
        functionName: 'approve',
        args: [this.universalRouterAddress, amountIn],
      });

      // Wait for approval to be mined
      await this.publicClient.waitForTransactionReceipt({
        hash: tokenApprovalHash,
      });

      const router = new AlphaRouter({
        chainId: base.id,
        provider: this.publicClient as any,
      });

      // Create token instances
      const tokenInInstance = new Token(base.id, tokenIn, 18);
      const tokenOutInstance = new Token(base.id, tokenOut, 18);

      // Create amount
      const amount = CurrencyAmount.fromRawAmount(
        tokenInInstance,
        amountIn.toString(),
      );

      // Get route
      const route = await router.route(
        amount,
        tokenOutInstance,
        TradeType.EXACT_INPUT,
        {
          recipient: this.account.address,
          slippageTolerance: new Percent(50, 10_000), // 0.5%
          type: SwapType.UNIVERSAL_ROUTER,
          version: UniversalRouterVersion.V1_2,
        },
      );

      if (!route || !route.methodParameters) {
        throw new Error('No route found');
      }

      // Execute the swap
      const swapHash = await this.walletClient.sendTransaction({
        to: this.universalRouterAddress,
        data: route.methodParameters.calldata as `0x${string}`,
        value: BigInt(route.methodParameters.value || 0),
      });

      // Wait for swap transaction to be mined
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: swapHash,
      });

      return {
        swapHash,
        receipt,
      };
    } catch (error) {
      throw new Error(`Failed to execute swap: ${error}`);
    }
  }

  /**
   * Get the wallet address
   */
  public getAddress(): `0x${string}` {
    return this.account.address;
  }
}
