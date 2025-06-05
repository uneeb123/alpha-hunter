'use client';
import React, { useState } from 'react';

type MetricColumn = { key: string; label: string };
type Filter = { key: string; value: number | string | undefined };

type TokensFilterFormProps = {
  metricColumns: MetricColumn[];
  filters: Filter[];
  sortKey: string;
  direction: string;
};

export default function TokensFilterForm({
  metricColumns,
  filters,
  sortKey,
  direction,
}: TokensFilterFormProps) {
  // Add state for createdAt filter (date string)
  const createdAtFilter = filters.find((f) => f.key === 'createdAt');
  const [createdAt, setCreatedAt] = useState<string>(
    createdAtFilter && typeof createdAtFilter.value === 'string'
      ? createdAtFilter.value
      : '',
  );
  const [rows, setRows] = useState<Filter[]>(
    filters.length
      ? filters.filter((f) => f.key !== 'createdAt')
      : [{ key: '', value: undefined }],
  );

  function handleChange(i: number, field: 'key' | 'value', value: string) {
    setRows((prev) => {
      const next = [...prev];
      if (field === 'key') next[i].key = value;
      if (field === 'value')
        next[i].value = value === '' ? undefined : Number(value);
      return next;
    });
  }

  function handleAddRow() {
    setRows((prev) => [...prev, { key: '', value: undefined }]);
  }

  function handleRemoveRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    let filterIdx = 0;
    // Add createdAt filter if set
    if (createdAt) {
      params.set(`filterKey${filterIdx}`, 'createdAt');
      params.set(`filterValue${filterIdx}`, createdAt);
      filterIdx++;
    }
    rows.forEach((row) => {
      if (
        row.key &&
        row.value !== undefined &&
        row.key !== 'createdAt' &&
        typeof row.value !== 'string' &&
        !isNaN(Number(row.value))
      ) {
        params.set(`filterKey${filterIdx}`, row.key);
        params.set(`filterValue${filterIdx}`, String(row.value));
        filterIdx++;
      }
    });
    params.set('sortKey', sortKey);
    params.set('direction', direction);
    window.location.search = params.toString();
  }

  function handleClear() {
    window.location.search = '';
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 16,
      }}
    >
      {/* Date picker for createdAt filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="createdAt-date">Created After:</label>
        <input
          id="createdAt-date"
          type="date"
          value={createdAt ? createdAt.slice(0, 10) : ''}
          onChange={(e) => {
            setCreatedAt(
              e.target.value ? new Date(e.target.value).toISOString() : '',
            );
          }}
          style={{ padding: 4 }}
        />
        {createdAt && (
          <button
            type="button"
            onClick={() => setCreatedAt('')}
            style={{ color: '#e74c3c', fontSize: 12 }}
          >
            Clear
          </button>
        )}
      </div>
      {/* Existing metric filters */}
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor={`filterKey${i}`}>Filter by:</label>
          <select
            id={`filterKey${i}`}
            name={`filterKey${i}`}
            value={row.key}
            onChange={(e) => handleChange(i, 'key', e.target.value)}
            style={{ padding: 4 }}
          >
            <option value="">-- Select metric --</option>
            {metricColumns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            name={`filterValue${i}`}
            placeholder="Min value"
            value={row.value ?? ''}
            onChange={(e) => handleChange(i, 'value', e.target.value)}
            style={{ padding: 4, width: 100 }}
            disabled={row.key === 'createdAt'}
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveRow(i)}
              style={{ color: '#e74c3c', fontSize: 12 }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddRow}
        style={{ padding: '2px 10px', fontSize: 13, marginTop: 4 }}
      >
        + Add Filter
      </button>
      <button type="submit" style={{ padding: '4px 12px', marginTop: 8 }}>
        Apply
      </button>
      {(rows.some((r) => r.key && r.value !== undefined) || createdAt) && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            marginLeft: 8,
            color: '#888',
            textDecoration: 'underline',
            fontSize: 12,
          }}
        >
          Clear all filters
        </button>
      )}
    </form>
  );
}
