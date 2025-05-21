'use client';

import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const VisualizationTab = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popover, setPopover] = useState<{
    cluster: any;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/visualization/tweet-embeddings');
        const chartData = await res.json();
        if (!Array.isArray(chartData) || chartData.length === 0) {
          setData([]);
          return;
        }
        setData(chartData);
      } catch {
        setError('Failed to load visualization data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading visualization...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!data.length) return <div>No data to visualize.</div>;

  // Normalize centroid.x and centroid.y to [0, 1] range
  const xVals = data.map((c) => c.centroid.x);
  const yVals = data.map((c) => c.centroid.y);
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);
  const norm = (val: number, min: number, max: number) =>
    max === min ? 0.5 : (val - min) / (max - min);
  const normalizedData = data.map((cluster) => ({
    ...cluster,
    centroid: {
      x: norm(cluster.centroid.x, minX, maxX),
      y: norm(cluster.centroid.y, minY, maxY),
    },
  }));

  // Normalize radii for display (move here for correct scope)
  const radii = normalizedData.map((c: any) => c.radius);
  const minR = Math.min(...radii);
  const maxR = Math.max(...radii);
  const normRadius = (r: number) =>
    maxR === minR ? 0.1 : 0.05 + 0.15 * ((r - minR) / (maxR - minR));

  // Pick colors for clusters
  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#A28FD0',
    '#FF6699',
  ];

  // Add custom shape component
  const CustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={normRadius(payload.radius) * 600} // 600 is chart height, adjust as needed
          fill={props.fill}
          fillOpacity={0.2}
        />
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={props.fill}
          fillOpacity={1}
          stroke="#333"
          strokeWidth={1}
        />
      </>
    );
  };

  return (
    <div style={{ width: '100%', height: 600, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
          <XAxis
            type="number"
            dataKey="centroid.x"
            name="UMAP-1"
            domain={[-0.1, 1.1]}
          />
          <YAxis
            type="number"
            dataKey="centroid.y"
            name="UMAP-2"
            domain={[-0.1, 1.1]}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #ccc',
                    padding: 10,
                    maxWidth: 300,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <b>Topic:</b> {d.topic}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <b>Cluster Size:</b> {d.count} tweets
                  </div>
                  <div style={{ color: '#888', fontSize: '0.9em' }}>
                    Click point for details
                  </div>
                </div>
              );
            }}
          />
          {normalizedData.map((cluster, i) => (
            <Scatter
              key={i}
              name={`${cluster.topic}`}
              data={[
                {
                  centroid: cluster.centroid,
                  radius: cluster.radius,
                  cluster: cluster.cluster,
                  count: cluster.count,
                  topic: cluster.topic,
                  highlight: cluster.highlight,
                  summary: cluster.summary,
                  tweetIds: cluster.tweetIds,
                },
              ]}
              fill={colors[i % colors.length]}
              shape={CustomShape}
              onClick={(_, index, e) => {
                if (e && e.pageX && e.pageY) {
                  setPopover({ cluster, x: e.pageX, y: e.pageY });
                }
              }}
            />
          ))}
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
      {/* Popover for cluster details */}
      {popover && (
        <div
          style={{
            position: 'fixed',
            left: popover.x + 16,
            top: popover.y - 40,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            padding: 24,
            zIndex: 1000,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <button
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#888',
            }}
            onClick={() => setPopover(null)}
            aria-label="Close"
          >
            ×
          </button>
          <div style={{ marginBottom: 12 }}>
            <b>Topic:</b> {popover.cluster.topic}
          </div>
          {popover.cluster.summary && (
            <div style={{ marginBottom: 12 }}>
              <b>Summary:</b>
              {Array.isArray(popover.cluster.summary) ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {popover.cluster.summary.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              ) : (
                (() => {
                  const lines = popover.cluster.summary
                    .split(/\r?\n/)
                    .map((l: string) => l.trim())
                    .filter(Boolean);
                  const isBulleted =
                    lines.length > 1 &&
                    lines.every(
                      (l: string) => l.startsWith('-') || l.startsWith('•'),
                    );
                  if (isBulleted) {
                    return (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {lines.map((line: string, idx: number) => (
                          <li key={idx}>{line.replace(/^[-•]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  } else {
                    return <div>{popover.cluster.summary}</div>;
                  }
                })()
              )}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <b>Cluster Size:</b> {popover.cluster.count} tweets
          </div>
          {Array.isArray(popover.cluster.tweetIds) &&
            popover.cluster.tweetIds.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <b>Tweets:</b>{' '}
                <span
                  style={{
                    display: 'inline-flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    verticalAlign: 'middle',
                  }}
                >
                  {popover.cluster.tweetIds.map(
                    (tweetId: string, idx: number) => (
                      <a
                        key={tweetId}
                        href={`https://twitter.com/i/web/status/${tweetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          // marginRight: 6,
                          verticalAlign: 'middle',
                        }}
                        title={`Open tweet ${idx + 1}`}
                      >
                        {/* Link icon SVG */}
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ verticalAlign: 'middle' }}
                        >
                          <path
                            d="M7.5 13.5L13.5 7.5M10.5 6.5H13.5V9.5"
                            stroke="#0074D9"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <rect
                            x="3.75"
                            y="3.75"
                            width="12.5"
                            height="12.5"
                            rx="3.25"
                            stroke="#0074D9"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </a>
                    ),
                  )}
                </span>
              </div>
            )}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div style={{ marginBottom: 4 }}>
              <b>Highlight Tweet:</b>
            </div>
            <div style={{ marginBottom: 4 }}>
              <i>@{popover.cluster.highlight.username}</i>
            </div>
            <div style={{ marginBottom: 4 }}>
              {popover.cluster.highlight.text}
            </div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              Smart Following: {popover.cluster.highlight.smartFollowingCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationTab;
