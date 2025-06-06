import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import ClientHome from '@/components/ClientHome';

// Add this export to prevent caching
export const dynamic = 'force-dynamic';

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

export default async function UserMetricsPage({
  searchParams,
}: {
  searchParams?: any;
}) {
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

  // Pass all required props to ClientHome
  return (
    <ClientHome
      users={sortedUsers}
      filters={filters.map((f) => ({ key: String(f.key), value: f.value }))}
      sortKey={String(sortKey)}
      direction={String(direction)}
      safeSearchParams={safeSearchParams}
    />
  );
}
