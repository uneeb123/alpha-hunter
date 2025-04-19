import styles from './page.module.css';
import TradingChart from '@/components/TradingChart';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// Add this export to prevent caching
export const dynamic = 'force-dynamic';

function formatTrades(swaps: any[]) {
  return swaps.map((swap) => ({
    time: Math.floor(new Date(swap.blockTimestamp).getTime() / 1000),
    // If it's a sell, make it negative
    value:
      swap.transactionType === TransactionType.SELL
        ? -Number(swap.baseAmount)
        : Number(swap.baseAmount),
  }));
}

export default async function Home() {
  // Get swaps from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const swaps = await prisma.swap.findMany({
    where: {
      blockTimestamp: {
        gte: oneHourAgo,
      },
    },
    orderBy: {
      blockTimestamp: 'asc',
    },
  });

  const trades = formatTrades(swaps);
  console.log('Number of trades:', trades.length);
  console.log('Sample trades:', trades.slice(0, 5));

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Token Trading Activity</h1>
        <div className={styles.chartContainer}>
          <TradingChart trades={trades} />
        </div>
      </main>
    </div>
  );
}
