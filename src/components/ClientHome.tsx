'use client';

import React from 'react';
import UserTable from '@/components/UserTable';
import FilterForm from '@/components/FilterForm';
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
  // Filtering and sorting logic can be moved here if needed, or passed from server

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
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
    </div>
  );
}
