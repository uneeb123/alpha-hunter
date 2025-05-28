import { getTrendingMemecoins } from '../../utils/birdeye';

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

async function main() {
  const tokens = await getTrendingMemecoins();
  console.log(
    'Top 10 Trending Memecoins on Solana & Base (sorted by 24h % change):\n',
  );
  tokens.forEach((token, index) => {
    console.log(
      `${index + 1}. ${token.name} (${token.symbol}) [${token.chain}] | Price: $${token.price.toFixed(6)} | 24h: ${token.price24hChangePercent !== null && token.price24hChangePercent !== undefined ? token.price24hChangePercent.toFixed(2) : 'N/A'}% | Market Cap: ${formatNumber(token.marketcap)} | Address: ${token.address}`,
    );
  });
}

main();
