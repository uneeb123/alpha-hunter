'use client';
import React, { useState } from 'react';
import { User } from '@prisma/client';
import axios from 'axios';

export type UserTableProps = {
  users: User[];
  sortKey: string;
  direction: string;
  searchParams?: Record<string, string>;
  onNextPage?: () => void;
};

const columns = [
  { key: 'index', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'followersCount', label: 'Followers' },
  { key: 'followingCount', label: 'Following' },
  { key: 'tweetCount', label: 'Tweets' },
  { key: 'likeCount', label: 'Likes' },
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

export default function UserTable({
  users: initialUsers,
  sortKey,
  direction,
  searchParams,
  onNextPage,
}: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(id);
    try {
      await axios.post('/api/delete-user', { id });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  function getSortUrl(key: string) {
    if (key === 'delete' || key === 'index') return undefined;
    const dir = sortKey === key && direction === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams(safeSearchParams(searchParams));
    params.set('sortKey', key);
    params.set('direction', dir);
    window.location.search = params.toString();
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
                  background: '#fafafa',
                  cursor:
                    col.key !== 'delete' && col.key !== 'index'
                      ? 'pointer'
                      : 'default',
                  color: sortKey === col.key ? '#0070f3' : undefined,
                  userSelect: 'none',
                }}
                onClick={() => getSortUrl(col.key)}
              >
                {col.label}
                {sortKey === col.key &&
                  col.key !== 'delete' &&
                  col.key !== 'index' && (
                    <span style={{ marginLeft: 4 }}>
                      {direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.id}>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {idx + 1}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.name}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.username}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.followersCount ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.followingCount ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.tweetCount ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.likeCount ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.smartFollowingCount ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.averageEngagement ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                {user.followerEngagementRatio ?? 'N/A'}
              </td>
              <td
                style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}
              >
                <button
                  style={{
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Delete user"
                  disabled={deletingId === user.id}
                  onClick={() => handleDelete(user.id)}
                >
                  {deletingId === user.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {onNextPage && (
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
      )}
    </div>
  );
}
