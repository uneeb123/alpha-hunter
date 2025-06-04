import React from 'react';
import TokensClient from './TokensClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string>;

type Filter = { key: string; value: number };

function parseFilters(searchParams: SearchParams | undefined): Filter[] {
  if (!searchParams) return [];
  const filters: Filter[] = [];
  let i = 0;
  while (true) {
    const key = searchParams[`filterKey${i}`];
    const value = searchParams[`filterValue${i}`];
    if (!key || value === undefined) break;
    const num = Number(value);
    if (key && !isNaN(num)) {
      filters.push({ key, value: num });
    }
    i++;
  }
  return filters;
}

export default async function TokensPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  // Await searchParams if it's a promise (per Next.js dynamic route requirements)
  const params: SearchParams =
    searchParams && typeof searchParams.then === 'function'
      ? await searchParams
      : (searchParams ?? {});

  const sortKey = (params?.sortKey as string) || 'v24hUSD';
  const direction = (params?.direction as 'asc' | 'desc') || 'desc';
  const offset = Number(params?.offset) || 0;
  const limit = 20;
  const filters = parseFilters(params);
  const min_liquidity = filters.find((f) => f.key === 'min_liquidity')?.value;
  const max_liquidity = filters.find((f) => f.key === 'max_liquidity')?.value;

  // Build Prisma query filters
  const where: any = { chain: 'solana' };
  if (min_liquidity !== undefined) where.liquidity = { gte: min_liquidity };
  if (max_liquidity !== undefined) {
    where.liquidity = where.liquidity
      ? { ...where.liquidity, lte: max_liquidity }
      : { lte: max_liquidity };
  }

  // Fetch tokens and total count from the database
  const [tokens, total] = await Promise.all([
    prisma.token.findMany({
      where,
      orderBy: { [sortKey]: direction },
      skip: offset,
      take: limit,
      select: {
        id: true,
        address: true,
        decimals: true,
        price: true,
        lastTradeUnixTime: true,
        liquidity: true,
        logoURI: true,
        mc: true,
        name: true,
        symbol: true,
        v24hChangePercent: true,
        v24hUSD: true,
        chain: true,
        updatedAt: true,
        fullyDilutedValuation: true,
        creationTime: true,
      },
    }),
    prisma.token.count({ where }),
  ]);

  return (
    <TokensClient
      tokens={tokens}
      total={total}
      offset={offset}
      limit={limit}
      sortKey={String(sortKey)}
      direction={String(direction)}
      filters={filters}
      searchParams={params}
    />
  );
}
