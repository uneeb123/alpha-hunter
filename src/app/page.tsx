import styles from './page.module.css';
import TradingChart from '@/components/TradingChart';
import { prisma } from '@/lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { Time } from 'lightweight-charts';

// Add this export to prevent caching
export const dynamic = 'force-dynamic';

function formatTrades(
  swaps: Array<{
    transactionType: TransactionType;
    baseAmount: Prisma.Decimal;
    blockTimestamp: Date;
  }>,
) {
  let runningTotal = 0;
  return swaps.map((swap) => {
    const amount =
      swap.transactionType === TransactionType.SELL
        ? -Number(swap.baseAmount)
        : Number(swap.baseAmount);
    runningTotal += amount;
    return {
      time: Math.floor(new Date(swap.blockTimestamp).getTime() / 1000) as Time,
      value: runningTotal,
    };
  });
}

export default async function Home() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const swaps = await prisma.swap.findMany({
    where: {
      blockTimestamp: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: {
      blockTimestamp: 'asc',
    },
  });

  const trades = formatTrades(swaps);

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
