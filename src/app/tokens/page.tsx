import React from 'react';
import TokensClient from './TokensClient';
import {
  getBirdeyeTokenList,
  getBirdeyeTokenListMultiChain,
  BirdeyeTokenListItem,
} from '@/utils/birdeye';

export const dynamic = 'force-dynamic';

const CHAINS = ['solana', 'base', 'sui'] as const;

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

  const sortKey = (params?.sortKey as keyof BirdeyeTokenListItem) || 'v24hUSD';
  const direction = (params?.direction as 'asc' | 'desc') || 'desc';
  const chain =
    params?.chain === 'all' || !params?.chain
      ? 'all'
      : (params?.chain as (typeof CHAINS)[number]);
  const offset = Number(params?.offset) || 0;
  const limit = 20;
  const filters = parseFilters(params);
  const min_liquidity = filters.find((f) => f.key === 'min_liquidity')?.value;
  const max_liquidity = filters.find((f) => f.key === 'max_liquidity')?.value;

  let tokens: BirdeyeTokenListItem[] = [];
  let total = 0;
  if (chain === 'all') {
    const response = await getBirdeyeTokenListMultiChain({
      chains: [...CHAINS],
      offset,
      limit,
      sort_by: sortKey as any,
      sort_type: direction,
      min_liquidity,
      max_liquidity,
    });
    tokens = response.data.tokens;
    total = response.data.total;
  } else {
    const response = await getBirdeyeTokenList({
      chain,
      offset,
      limit,
      sort_by: sortKey as any,
      sort_type: direction,
      min_liquidity,
      max_liquidity,
    });
    tokens = response.data.tokens;
    total = response.data.total;
  }

  return (
    <TokensClient
      tokens={tokens}
      total={total}
      offset={offset}
      limit={limit}
      sortKey={String(sortKey)}
      direction={String(direction)}
      chain={chain}
      filters={filters}
      searchParams={params}
    />
  );
}
