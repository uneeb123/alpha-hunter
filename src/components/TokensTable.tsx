import React, { useState } from 'react';
import { BirdeyeTokenListItem } from '@/utils/birdeye';

type TokensTableProps = {
  tokens: BirdeyeTokenListItem[];
  sortKey: string;
  direction: string;
  searchParams?: Record<string, string>;
  onNextPage: () => void;
};

const columns = [
  { key: 'index', label: '#' },
  { key: 'logo', label: '' },
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'v24hUSD', label: '24h Volume (USD)' },
  { key: 'v24hChangePercent', label: '24h Change (%)' },
  { key: 'mc', label: 'Market Cap' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'lastTradeUnixTime', label: 'Last Trade' },
  { key: 'updatedAt', label: 'Last Updated At' },
  { key: 'copy', label: '' },
];

function safeSearchParams(
  params: Record<string, string> | undefined,
): Record<string, string> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof k === 'string' && typeof v === 'string') {
      out[k] = v;
    }
  }
  return out;
}

function formatNumber(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(digits)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(digits)}K`;
  return `$${n.toFixed(digits)}`;
}

function formatDate(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleString();
}

function formatDateTime(date: Date | string | number | null | undefined) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
}

function RefreshButton({
  address,
  onRefresh,
}: {
  address: string;
  onRefresh: (updated: any) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const resp = await fetch('/api/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess(true);
        onRefresh(data.token);
        setTimeout(() => setSuccess(false), 1200);
      } else {
        console.log(data.error || 'Failed to refresh');
      }
    } catch (e: any) {
      console.log(e?.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        background: success ? '#16a34a' : '#f2f2f2',
        color: success ? '#fff' : '#222',
        border: 'none',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 13,
        minWidth: 70,
        marginLeft: 6,
        transition: 'background 0.2s',
      }}
      title={address}
    >
      {loading ? 'Refreshing...' : success ? 'Refreshed!' : 'Refresh'}
    </button>
  );
}

export default function TokensTable({
  tokens,
  sortKey,
  direction,
  searchParams,
  onNextPage,
}: TokensTableProps) {
  const [rows, setRows] = React.useState(tokens);
  React.useEffect(() => {
    setRows(tokens);
  }, [tokens]);

  const handleRefreshRow = (address: string, updated: any) => {
    setRows((prev) =>
      prev.map((row) =>
        row.address === address ? { ...row, ...updated } : row,
      ),
    );
  };

  function getSortUrl(key: string) {
    const dir = sortKey === key && direction === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams(safeSearchParams(searchParams));
    params.set('sortKey', key);
    params.set('direction', dir);
    return `?${params.toString()}`;
  }

  return (
    <div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  borderBottom: '1px solid #ccc',
                  padding: '8px 4px',
                  textAlign: 'left',
                  cursor: [
                    'v24hUSD',
                    'mc',
                    'v24hChangePercent',
                    'liquidity',
                  ].includes(col.key)
                    ? 'pointer'
                    : 'default',
                  background: '#fafafa',
                  width: col.key === 'logo' ? 32 : undefined,
                }}
              >
                {['v24hUSD', 'mc', 'v24hChangePercent', 'liquidity'].includes(
                  col.key,
                ) ? (
                  <a
                    href={getSortUrl(col.key)}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {col.label}
                    {sortKey === col.key
                      ? direction === 'asc'
                        ? ' ▲'
                        : ' ▼'
                      : ''}
                  </a>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((token, idx) => (
            <tr key={token.address}>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {idx + 1}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                <TokenLogo logoURI={token.logoURI} symbol={token.symbol} />
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {token.name}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {token.symbol}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {formatNumber(token.v24hUSD)}
              </td>
              <td
                style={{
                  padding: '6px 4px',
                  borderBottom: '1px solid #eee',
                  color:
                    token.v24hChangePercent !== null &&
                    token.v24hChangePercent !== undefined
                      ? token.v24hChangePercent > 0
                        ? '#16a34a'
                        : token.v24hChangePercent < 0
                          ? '#dc2626'
                          : undefined
                      : undefined,
                }}
              >
                {token.v24hChangePercent !== null &&
                token.v24hChangePercent !== undefined
                  ? token.v24hChangePercent.toFixed(2) + '%'
                  : 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {formatNumber(token.mc)}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {formatNumber(token.liquidity)}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {formatDate(token.lastTradeUnixTime)}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {formatDateTime(token.updatedAt)}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <CopyAddressButton address={token.address} />
                  <RefreshButton
                    address={token.address}
                    onRefresh={(updated) =>
                      handleRefreshRow(token.address, updated)
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}
      >
        <button
          onClick={onNextPage}
          style={{
            padding: '6px 18px',
            borderRadius: 6,
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TokenLogo({
  logoURI,
  symbol,
}: {
  logoURI: string | null;
  symbol: string;
}) {
  const [error, setError] = useState(false);
  if (!logoURI || error) {
    // Fallback: colored circle with symbol or a generic icon
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: '#555',
          fontWeight: 600,
        }}
        title={symbol}
      >
        {symbol?.slice(0, 3).toUpperCase() || '❓'}
      </div>
    );
  }
  return (
    <img
      src={logoURI}
      alt={symbol}
      style={{ width: 24, height: 24, borderRadius: 12, objectFit: 'cover' }}
      onError={() => setError(true)}
    />
  );
}

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        background: copied ? '#16a34a' : '#f2f2f2',
        color: copied ? '#fff' : '#222',
        border: 'none',
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: 13,
        minWidth: 70,
        transition: 'background 0.2s',
      }}
      title={address}
    >
      {copied ? 'Copied!' : 'Copy Address'}
    </button>
  );
}
