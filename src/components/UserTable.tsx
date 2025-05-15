'use client';
import React from 'react';
import { User } from '@prisma/client';

type UserTableProps = {
  users: User[];
  sortKey: string;
  direction: string;
  filterKey?: string;
  filterValue?: number;
  searchParams?: Record<string, string>;
};

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

async function deleteUser(userId: number) {
  await fetch('/api/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId }),
  });
  window.location.reload();
}

export default function UserTable({
  users,
  sortKey,
  direction,
  filterKey,
  filterValue,
  searchParams,
}: UserTableProps) {
  function getSortUrl(key: string) {
    const dir = sortKey === key && direction === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams(safeSearchParams(searchParams));
    params.set('sortKey', key);
    params.set('direction', dir);
    if (filterKey) params.set('filterKey', filterKey);
    if (filterValue !== undefined)
      params.set('filterValue', String(filterValue));
    return `?${params.toString()}`;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                borderBottom: '1px solid #ccc',
                padding: '8px 4px',
                textAlign: 'left',
                cursor: 'pointer',
                background: '#fafafa',
              }}
            >
              {col.key === 'delete' ? (
                col.label
              ) : (
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
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((user, idx) => (
          <tr
            key={user.id}
            style={{ position: 'relative' }}
            onMouseEnter={(e) => {
              if (!user.description) return;
              const tooltip = document.createElement('div');
              tooltip.textContent = user.description;
              tooltip.style.position = 'fixed';
              const rect = e.currentTarget.getBoundingClientRect();
              tooltip.style.left = `${rect.left + 20}px`;
              tooltip.style.top = `${rect.bottom + 4}px`;
              tooltip.style.background = '#222';
              tooltip.style.color = '#fff';
              tooltip.style.padding = '6px 12px';
              tooltip.style.borderRadius = '4px';
              tooltip.style.fontSize = '13px';
              tooltip.style.zIndex = '1000';
              tooltip.style.whiteSpace = 'pre-line';
              tooltip.className = 'row-tooltip';
              document.body.appendChild(tooltip);
            }}
            onMouseLeave={() => {
              const tooltips = document.querySelectorAll('.row-tooltip');
              tooltips.forEach((t) => t.remove());
            }}
          >
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {idx + 1}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.name}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              @{user.username}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.followersCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.followingCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.tweetCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.listedCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.likeCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.mediaCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.smartFollowingCount ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.averageEngagement?.toFixed(4) ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              {user.followerEngagementRatio?.toFixed(2) ?? ''}
            </td>
            <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (
                    window.confirm('Are you sure you want to delete this user?')
                  ) {
                    await deleteUser(user.id);
                  }
                }}
                style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                title="Delete user"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
