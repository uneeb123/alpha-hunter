import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import React from 'react';
import UserTable from '@/components/UserTable';
import FilterForm from '@/components/FilterForm';

// Add this export to prevent caching
export const dynamic = 'force-dynamic';

const columns = [
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

const metricColumns = columns.filter((col) =>
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
);

type Filter = { key: keyof User; value: number };

function parseFilters(
  searchParams: Record<string, string> | undefined,
): Filter[] {
  if (!searchParams) return [];
  const filters: Filter[] = [];
  let i = 0;
  while (true) {
    const key = searchParams[`filterKey${i}`] as keyof User | undefined;
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

function sortUsers(
  users: User[],
  sortKey: keyof User,
  direction: 'asc' | 'desc',
) {
  return [...users].sort((a, b) => {
    const aValue = a[sortKey] ?? 0;
    const bValue = b[sortKey] ?? 0;
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function filterUsers(users: User[], filters: Filter[]) {
  if (!filters.length) return users;
  return users.filter((user) =>
    filters.every((f) => {
      const v = user[f.key];
      return typeof v === 'number' && v >= f.value;
    }),
  );
}

export default async function Home({ searchParams }: { searchParams?: any }) {
  // Always resolve searchParams to a plain object
  const params: Record<string, string> =
    searchParams && typeof searchParams.then === 'function'
      ? await searchParams
      : (searchParams ?? {});

  const sortKey = (params?.sortKey as keyof User) || 'smartFollowingCount';
  const direction = (params?.direction as 'asc' | 'desc') || 'desc';
  const filters = parseFilters(params);

  const users = await prisma.user.findMany();
  const filteredUsers = filterUsers(users, filters);
  const sortedUsers = sortUsers(filteredUsers, sortKey, direction);

  // Sanitize params to a plain object of strings
  const safeSearchParams = Object.fromEntries(
    Object.entries(params ?? {}).filter(
      ([k, v]) => typeof k === 'string' && typeof v === 'string',
    ),
  );

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
          <a href="/" style={{ textDecoration: 'none', color: '#0070f3' }}>
            User Metrics
          </a>
          <a
            href="/bot-controls"
            style={{ textDecoration: 'none', color: '#0070f3' }}
          >
            Bot Controls
          </a>
        </div>
      </nav>
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>User Metrics</h1>
        <FilterForm
          metricColumns={metricColumns}
          filters={filters.map((f) => ({ key: String(f.key), value: f.value }))}
          sortKey={String(sortKey)}
          direction={String(direction)}
        />
        <UserTable
          users={sortedUsers}
          sortKey={String(sortKey)}
          direction={String(direction)}
          filterKey={undefined}
          filterValue={undefined}
          searchParams={safeSearchParams}
        />
      </div>
    </>
  );
}
