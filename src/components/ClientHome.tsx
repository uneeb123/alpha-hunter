'use client';

import React, { useState } from 'react';
import VisualizationTab from '@/components/VisualizationTab';
import UserTable from '@/components/UserTable';
import FilterForm from '@/components/FilterForm';
import Link from 'next/link';
import { User } from '@prisma/client';

const metricColumns = [
  { key: 'index', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'followersCount', label: 'Followers' },
  { key: 'followingCount', label: 'Following' },
  { key: 'tweetCount', label: 'Tweets' },
  { key: 'listedCount', label: 'Listed' },
  { key: 'likeCount', label: 'Likes' },
  { key: 'mediaCount', label: 'Media' },
  { key: 'smartFollowingCount', label: 'Smart Following' },
  { key: 'averageEngagement', label: 'Avg Engagement' },
  { key: 'followerEngagementRatio', label: 'Follower Engagement Ratio' },
  { key: 'delete', label: 'Delete' },
];

interface ClientHomeProps {
  users: User[];
  filters: { key: string; value: number }[];
  sortKey: string;
  direction: string;
  safeSearchParams: Record<string, string>;
}

export default function ClientHome({
  users,
  filters,
  sortKey,
  direction,
  safeSearchParams,
}: ClientHomeProps) {
  const [tab, setTab] = useState<'metrics' | 'visualization'>('metrics');

  // Filtering and sorting logic can be moved here if needed, or passed from server

  return (
    <>
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
          <button
            onClick={() => setTab('metrics')}
            style={{
              textDecoration: tab === 'metrics' ? 'underline' : 'none',
              color: '#0070f3',
              background: 'none',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            User Metrics
          </button>
          <button
            onClick={() => setTab('visualization')}
            style={{
              textDecoration: tab === 'visualization' ? 'underline' : 'none',
              color: '#0070f3',
              background: 'none',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Visualization
          </button>
          <Link
            href="/bot-controls"
            style={{ textDecoration: 'none', color: '#0070f3' }}
          >
            Bot Controls
          </Link>
        </div>
      </nav>
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
        {tab === 'metrics' && (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 24 }}>User Metrics</h1>
            <FilterForm
              metricColumns={metricColumns.filter((col) =>
                [
                  'followersCount',
                  'followingCount',
                  'tweetCount',
                  'listedCount',
                  'likeCount',
                  'mediaCount',
                  'smartFollowingCount',
                  'averageEngagement',
                  'followerEngagementRatio',
                ].includes(col.key),
              )}
              filters={filters}
              sortKey={String(sortKey)}
              direction={String(direction)}
            />
            <UserTable
              users={users}
              sortKey={String(sortKey)}
              direction={String(direction)}
              filterKey={undefined}
              filterValue={undefined}
              searchParams={safeSearchParams}
            />
          </>
        )}
        {tab === 'visualization' && <VisualizationTab />}
      </div>
    </>
  );
}
