/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  erc20Abi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getSecrets } from './secrets';
import { WETH } from './constants';
import { MoralisClient } from './moralis_client';
import type { MoralisTokenBalance } from '@/types';
import {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
  ChainId,
} from '@uniswap/sdk-core';
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';
import { ethers, TypedDataField } from 'ethers';
import {
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from '@uniswap/universal-router-sdk';
import { permit2Abi } from './abis/permit2';
import {
  PERMIT2_ADDRESS,
  MaxAllowanceTransferAmount,
  PermitSingle,
  AllowanceTransfer,
} from '@uniswap/permit2-sdk';

export class EthClient {
  private publicClient;
  private walletClient;
  private account;
  private moralisClient: MoralisClient;
  private provider;
  private routerAddress: `0x${string}`;

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

    // Initialize ethers provider
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Initialize Moralis client
    this.moralisClient = MoralisClient.getInstance();

    this.routerAddress = UNIVERSAL_ROUTER_ADDRESS(
      UniversalRouterVersion.V2_0,
      ChainId.BASE,
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
   * @param tokenAddress The address of the token to buy
   * @param amountIn The amount of WETH to spend (in wei)
   */
  public async buy(
    tokenAddress: `0x${string}`,
    amountIn: string,
    slippageToleranceBps: number = 50,
    maxGas: number = 800_000,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
    amountOut: string;
  }> {
    return this.swap(
      WETH,
      tokenAddress,
      amountIn,
      slippageToleranceBps,
      maxGas,
    );
  }

  /**
   * Sell tokens for WETH
   * @param tokenAddress The address of the token to sell
   * @param amountIn The amount of tokens to sell (in wei)
   * @param amountOutMinimum The minimum amount of WETH to receive (in wei)
   */
  public async sell(
    tokenAddress: `0x${string}`,
    amountIn: string,
    slippageToleranceBps: number = 50,
    maxGas: number = 800_000,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
    amountOut: string;
  }> {
    return this.swap(
      tokenAddress,
      WETH,
      amountIn,
      slippageToleranceBps,
      maxGas,
    );
  }

  /**
   * Swaps tokens using V3 Swap Router on Base
   * @param tokenIn The address of the token to swap from
   * @param tokenOut The address of the token to swap to
   * @param amountIn The amount of tokenIn to swap (in native currency)
   */
  public async swap(
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    amountInRaw: string,
    slippageToleranceBps: number = 50,
    maxGas: number = 800_000,
  ): Promise<{
    swapHash: `0x${string}`;
    receipt: any;
    amountOut: string;
  }> {
    try {
      // Get token decimals
      const tokenInDecimals = Number(
        await this.publicClient.readContract({
          address: tokenIn,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      );

      const tokenOutDecimals = Number(
        await this.publicClient.readContract({
          address: tokenOut,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      );

      // Create token instances with correct decimals
      const tokenInInstance = new Token(base.id, tokenIn, tokenInDecimals);
      const tokenOutInstance = new Token(base.id, tokenOut, tokenOutDecimals);

      // Create amount
      const amountInBaseUnits = ethers.utils.parseUnits(
        amountInRaw,
        tokenInDecimals,
      );
      const amountIn = CurrencyAmount.fromRawAmount(
        tokenInInstance,
        amountInBaseUnits.toString(),
      );

      // Check allowance
      const allowanceData = (await this.publicClient.readContract({
        address: tokenIn,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [this.account.address, PERMIT2_ADDRESS],
      })) as bigint;

      const allowance = allowanceData;

      // Only approve if needed
      if (allowance < ethers.constants.MaxUint256.toBigInt()) {
        console.log('Approving tokens...');
        const tokenApprovalHash = await this.walletClient.writeContract({
          address: tokenIn,
          abi: erc20Abi,
          functionName: 'approve',
          args: [PERMIT2_ADDRESS, ethers.constants.MaxUint256.toBigInt()],
        });

        // Wait for approval to be mined
        await this.publicClient.waitForTransactionReceipt({
          hash: tokenApprovalHash,
        });
        console.log('Approval confirmed');
      }

      const nonce = await this.publicClient
        .readContract({
          address: PERMIT2_ADDRESS,
          abi: permit2Abi,
          functionName: 'allowance',
          args: [this.account.address, tokenIn, this.routerAddress],
        })
        .then((result) =>
          Number((result as readonly [bigint, number, number])[2]),
        );

      console.log('Nonce: ', nonce);

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
      const permitSingle: PermitSingle = {
        details: {
          token: tokenIn,
          amount: MaxAllowanceTransferAmount,
          expiration: deadline,
          nonce,
        },
        spender: UNIVERSAL_ROUTER_ADDRESS(
          UniversalRouterVersion.V2_0,
          ChainId.BASE,
        ),
        sigDeadline: deadline,
      };

      const { domain, types, values } = AllowanceTransfer.getPermitData(
        permitSingle,
        PERMIT2_ADDRESS,
        ChainId.BASE,
      );

      const signer = new ethers.Wallet(
        getSecrets().ethPrivateKey,
        this.provider,
      );

      const signature = await signer._signTypedData(
        domain as { name: string; chainId: number; verifyingContract: string },
        types as Record<string, Array<TypedDataField>>,
        values,
      );

      const router = new AlphaRouter({
        chainId: ChainId.BASE, // Base Mainnet
        provider: this.provider,
      });

      // Get route
      console.log('Getting route...');
      const route = await router.route(
        amountIn,
        tokenOutInstance,
        TradeType.EXACT_INPUT,
        {
          recipient: this.account.address,
          slippageTolerance: new Percent(slippageToleranceBps, 10_000),
          type: SwapType.UNIVERSAL_ROUTER,
          version: UniversalRouterVersion.V2_0,
          inputTokenPermit: {
            ...permitSingle,
            signature,
          },
        },
      );

      if (!route) {
        throw new Error('No route found');
      }

      // Execute swap
      console.log('Executing swap...');
      const swapHash = await this.walletClient.sendTransaction({
        to: this.routerAddress,
        data: route.methodParameters!.calldata as `0x${string}`,
        value: BigInt(route.methodParameters!.value || 0),
        gas: BigInt(maxGas),
      });

      // Wait for swap transaction to be mined
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: swapHash,
      });

      return {
        swapHash,
        receipt,
        amountOut: route.quote.toExact(),
      };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  /**
   * Get the wallet address
   */
  public getAddress(): `0x${string}` {
    return this.account.address;
  }
}
