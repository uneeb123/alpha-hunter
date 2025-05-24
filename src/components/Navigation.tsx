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
          href="/"
          style={{
            textDecoration: pathname === '/' ? 'underline' : 'none',
            color: '#0070f3',
          }}
        >
          User Metrics
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
      </div>
    </nav>
  );
}
