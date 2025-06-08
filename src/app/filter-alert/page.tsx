'use client';
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const FILTER_NAME = 'alert1';

type FilterFormState = {
  [key: string]: string;
  sort_by: string;
  sort_type: string;
  min_liquidity: string;
  max_liquidity: string;
  min_market_cap: string;
  max_market_cap: string;
  min_fdv: string;
  max_fdv: string;
  min_recent_listing_time: string;
  max_recent_listing_time: string;
  min_last_trade_unix_time: string;
  max_last_trade_unix_time: string;
  min_holder: string;
  min_volume_1h_usd: string;
  min_volume_2h_usd: string;
  min_volume_4h_usd: string;
  min_volume_8h_usd: string;
  min_volume_24h_usd: string;
  min_volume_1h_change_percent: string;
  min_volume_2h_change_percent: string;
  min_volume_4h_change_percent: string;
  min_volume_8h_change_percent: string;
  min_volume_24h_change_percent: string;
  min_price_change_1h_percent: string;
  min_price_change_2h_percent: string;
  min_price_change_4h_percent: string;
  min_price_change_8h_percent: string;
  min_price_change_24h_percent: string;
  min_trade_1h_count: string;
  min_trade_2h_count: string;
  min_trade_4h_count: string;
  min_trade_8h_count: string;
  min_trade_24h_count: string;
};

const initialState: FilterFormState = {
  sort_by: '',
  sort_type: '',
  min_liquidity: '',
  max_liquidity: '',
  min_market_cap: '',
  max_market_cap: '',
  min_fdv: '',
  max_fdv: '',
  min_recent_listing_time: '',
  max_recent_listing_time: '',
  min_last_trade_unix_time: '',
  max_last_trade_unix_time: '',
  min_holder: '',
  min_volume_1h_usd: '',
  min_volume_2h_usd: '',
  min_volume_4h_usd: '',
  min_volume_8h_usd: '',
  min_volume_24h_usd: '',
  min_volume_1h_change_percent: '',
  min_volume_2h_change_percent: '',
  min_volume_4h_change_percent: '',
  min_volume_8h_change_percent: '',
  min_volume_24h_change_percent: '',
  min_price_change_1h_percent: '',
  min_price_change_2h_percent: '',
  min_price_change_4h_percent: '',
  min_price_change_8h_percent: '',
  min_price_change_24h_percent: '',
  min_trade_1h_count: '',
  min_trade_2h_count: '',
  min_trade_4h_count: '',
  min_trade_8h_count: '',
  min_trade_24h_count: '',
};

const sortByOptions = [
  'market_cap',
  'fdv',
  'liquidity',
  'last_trade_unix_time',
  'volume_1h_usd',
  'volume_1h_change_percent',
  'volume_2h_usd',
  'volume_2h_change_percent',
  'volume_4h_usd',
  'volume_4h_change_percent',
  'volume_8h_usd',
  'volume_8h_change_percent',
  'volume_24h_usd',
  'volume_24h_change_percent',
  'trade_1h_count',
  'trade_2h_count',
  'trade_4h_count',
  'trade_8h_count',
  'trade_24h_count',
  'price_change_1h_percent',
  'price_change_2h_percent',
  'price_change_4h_percent',
  'price_change_8h_percent',
  'price_change_24h_percent',
  'holder',
  'recent_listing_time',
];
const sortTypeOptions = ['asc', 'desc'];

function sanitizeFilterData(
  data: Record<string, any>,
  floatFields: string[],
  intFields: string[],
) {
  const sanitized: Record<string, any> = { ...data };
  for (const key of floatFields) {
    if (sanitized[key] === '') {
      sanitized[key] = null;
    } else if (sanitized[key] !== null && sanitized[key] !== undefined) {
      sanitized[key] = parseFloat(sanitized[key]);
      if (isNaN(sanitized[key])) sanitized[key] = null;
    }
  }
  for (const key of intFields) {
    if (sanitized[key] === '') {
      sanitized[key] = null;
    } else if (sanitized[key] !== null && sanitized[key] !== undefined) {
      sanitized[key] = parseInt(sanitized[key], 10);
      if (isNaN(sanitized[key])) sanitized[key] = null;
    }
  }
  return sanitized;
}

export default function FilterAlertPage() {
  const [form, setForm] = useState<FilterFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/filter?name=${FILTER_NAME}`)
      .then((res) => {
        if (res.data) {
          setForm({ ...initialState, ...res.data });
        } else {
          setForm(initialState);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setSuccess(false);
    try {
      const floatFields = [
        'min_liquidity',
        'max_liquidity',
        'min_market_cap',
        'max_market_cap',
        'min_fdv',
        'max_fdv',
        'min_volume_1h_usd',
        'min_volume_2h_usd',
        'min_volume_4h_usd',
        'min_volume_8h_usd',
        'min_volume_24h_usd',
        'min_volume_1h_change_percent',
        'min_volume_2h_change_percent',
        'min_volume_4h_change_percent',
        'min_volume_8h_change_percent',
        'min_volume_24h_change_percent',
        'min_price_change_1h_percent',
        'min_price_change_2h_percent',
        'min_price_change_4h_percent',
        'min_price_change_8h_percent',
        'min_price_change_24h_percent',
      ];
      const intFields = [
        'min_recent_listing_time',
        'max_recent_listing_time',
        'min_last_trade_unix_time',
        'max_last_trade_unix_time',
        'min_holder',
        'min_trade_1h_count',
        'min_trade_2h_count',
        'min_trade_4h_count',
        'min_trade_8h_count',
        'min_trade_24h_count',
      ];
      const sanitizedForm = sanitizeFilterData(form, floatFields, intFields);
      await axios.post('/api/filter', { ...sanitizedForm, name: FILTER_NAME });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !form) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: '40px auto',
        padding: 24,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px #eee',
      }}
    >
      <h2>Filter Alert Settings (&quot;alert1&quot;)</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {Object.keys(initialState).map((key) =>
          key === 'chain' ? null : (
            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor={key} style={{ fontWeight: 500 }}>
                {key}
              </label>
              {key === 'sort_by' ? (
                <select
                  id={key}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  style={{
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                >
                  <option value="">Select sort by...</option>
                  {sortByOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : key === 'sort_type' ? (
                <select
                  id={key}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  style={{
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                >
                  <option value="">Select sort type...</option>
                  {sortTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={key}
                  name={key}
                  type="text"
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  style={{
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          ),
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {success && <div style={{ color: 'green', marginTop: 8 }}>Saved!</div>}
      </form>
    </div>
  );
}
