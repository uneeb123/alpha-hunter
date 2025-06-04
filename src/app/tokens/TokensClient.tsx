'use client';
import React from 'react';
import TokensTable from '@/components/TokensTable';
import FilterForm from '@/components/FilterForm';
import { BirdeyeTokenListItem } from '@/utils/birdeye';

type Filter = { key: string; value: number };

type TokensClientProps = {
  tokens: (BirdeyeTokenListItem & { creationTime?: Date | null })[];
  total: number;
  offset: number;
  limit: number;
  sortKey: string;
  direction: string;
  filters: Filter[];
  searchParams: Record<string, string>;
};

export default function TokensClient({
  tokens,
  total,
  offset,
  limit,
  sortKey,
  direction,
  filters,
  searchParams,
}: TokensClientProps) {
  function getNextPageUrl() {
    const paramsObj = {
      ...searchParams,
      offset: String(offset + limit),
    };
    const search = new URLSearchParams(paramsObj).toString();
    return `?${search}`;
  }

  const metricColumns = [
    { key: 'min_liquidity', label: 'Min Liquidity' },
    { key: 'max_liquidity', label: 'Max Liquidity' },
    { key: 'min_market_cap', label: 'Min Market Cap' },
  ];

  // Apply client-side min_market_cap filter
  const minMarketCap = filters.find((f) => f.key === 'min_market_cap')?.value;
  const filteredTokens =
    minMarketCap !== undefined
      ? tokens.filter((t) => t.mc !== null && t.mc >= minMarketCap)
      : tokens;

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  function getPageUrl(page: number) {
    const paramsObj = {
      ...searchParams,
      offset: String((page - 1) * limit),
    };
    const search = new URLSearchParams(paramsObj).toString();
    return `?${search}`;
  }

  function renderPagination() {
    if (totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 3) {
      end = Math.min(5, totalPages);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return (
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: 16,
        }}
      >
        {start > 1 && (
          <a
            href={getPageUrl(1)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: '#f2f2f2',
              color: '#222',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            1
          </a>
        )}
        {start > 2 && <span style={{ color: '#888' }}>...</span>}
        {pages.map((page) => (
          <a
            key={page}
            href={getPageUrl(page)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: page === currentPage ? '#0070f3' : '#f2f2f2',
              color: page === currentPage ? '#fff' : '#222',
              textDecoration: 'none',
              fontWeight: 500,
              pointerEvents: page === currentPage ? 'none' : undefined,
              opacity: page === currentPage ? 0.8 : 1,
            }}
          >
            {page}
          </a>
        ))}
        {end < totalPages - 1 && <span style={{ color: '#888' }}>...</span>}
        {end < totalPages && (
          <a
            href={getPageUrl(totalPages)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: '#f2f2f2',
              color: '#222',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            {totalPages}
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Solana Tokens</h1>
      <FilterForm
        metricColumns={metricColumns}
        filters={filters}
        sortKey={String(sortKey)}
        direction={String(direction)}
      />
      <TokensTable
        tokens={filteredTokens}
        sortKey={String(sortKey)}
        direction={String(direction)}
        searchParams={searchParams}
        onNextPage={() => {
          window.location.href = getNextPageUrl();
        }}
        showCreatedAt={true}
      />
      <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
        Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} tokens
      </div>
      {renderPagination()}
    </div>
  );
}
