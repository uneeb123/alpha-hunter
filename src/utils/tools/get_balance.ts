import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SniperooClient } from '@/utils/sniperoo_client';
import { Position } from '@/types/sniperoo';

interface AggregatedPosition {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  totalTokenAmount: number;
  totalSolAmount: number;
}

export const getBalance = tool(
  async () => {
    try {
      const sniperoo = new SniperooClient();
      const [wallet, positions] = await Promise.all([
        sniperoo.getWallet(),
        sniperoo.getPositions(),
      ]);

      // Aggregate positions by token address
      const aggregatedPositions = positions.reduce(
        (acc: { [key: string]: AggregatedPosition }, position: Position) => {
          const tokenAddress = position.tokenAddress;
          const tokenAmount = parseFloat(position.initialTokenAmount);
          const solAmount = parseFloat(position.initialSolAmount);

          if (!acc[tokenAddress]) {
            acc[tokenAddress] = {
              tokenAddress,
              tokenName: position.tokenExtraInfo.tokenName,
              tokenSymbol: position.tokenExtraInfo.tokenSymbol,
              totalTokenAmount: 0,
              totalSolAmount: 0,
            };
          }

          acc[tokenAddress].totalTokenAmount += tokenAmount;
          acc[tokenAddress].totalSolAmount += solAmount;

          return acc;
        },
        {},
      );

      // Format wallet and positions information
      const walletInfo = `Wallet Address: ${wallet.address}\nSOL Balance: ${wallet.solBalance} SOL\n`;

      const positionsInfo = Object.values(aggregatedPositions)
        .map(
          (pos) =>
            `${pos.tokenName} (${pos.tokenSymbol}):\n` +
            `  Token Address: ${pos.tokenAddress}\n` +
            `  Balance: ${pos.totalTokenAmount.toFixed(4)} tokens\n` +
            `  Value: ${pos.totalSolAmount.toFixed(4)} SOL`,
        )
        .join('\n\n');

      return positionsInfo.length > 0
        ? `${walletInfo}\nToken Positions:\n${positionsInfo}`
        : `${walletInfo}\nNo active token positions found.`;
    } catch (error) {
      console.error(
        'Error in getBalance:',
        error instanceof Error ? error.message : String(error),
      );
      return 'Sorry, had trouble fetching wallet and positions information.';
    }
  },
  {
    name: 'get_balance',
    description: 'Get wallet details',
    schema: z.object({
      noOp: z.string().optional().describe('No-op parameter.'),
    }),
  },
);
