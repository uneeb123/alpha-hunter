'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        padding: '16px 24px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #eaeaea',
      }}
    >
      <div
        style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24 }}
      >
        <Link
          href="/tokens"
          style={{
            textDecoration: pathname === '/tokens' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          Tokens
        </Link>
        <Link
          href="/visualization"
          style={{
            textDecoration:
              pathname === '/visualization' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          Visualization
        </Link>
        <Link
          href="/ask"
          style={{
            textDecoration: pathname === '/ask' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          Ask
        </Link>
        <Link
          href="/user-metrics"
          style={{
            textDecoration: pathname === '/user-metrics' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          User Metrics
        </Link>
        <Link
          href="/filter-alert"
          style={{
            textDecoration: pathname === '/filter-alert' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          Filter Alert
        </Link>
        <Link
          href="/broadcast"
          style={{
            textDecoration: pathname === '/broadcast' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          Broadcast
        </Link>
      </div>
    </nav>
  );
}
