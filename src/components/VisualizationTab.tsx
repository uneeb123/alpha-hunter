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
    <ResponsiveContainer width="100%" height={600}>
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
                {d.summary && (
                  <div style={{ marginBottom: 8 }}>
                    <b>Summary:</b>
                    {Array.isArray(d.summary) ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {d.summary.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      // If summary is a string, check for bullet points
                      (() => {
                        // Split by newlines and filter out empty lines
                        const lines = d.summary
                          .split(/\r?\n/)
                          .map((l: string) => l.trim())
                          .filter(Boolean);
                        const isBulleted =
                          lines.length > 1 &&
                          lines.every(
                            (l: string) =>
                              l.startsWith('-') || l.startsWith('•'),
                          );
                        if (isBulleted) {
                          return (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {lines.map((line: string, idx: number) => (
                                <li key={idx}>
                                  {line.replace(/^[-•]\s*/, '')}
                                </li>
                              ))}
                            </ul>
                          );
                        } else {
                          return <div>{d.summary}</div>;
                        }
                      })()
                    )}
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <b>Cluster Size:</b> {d.count} tweets
                </div>
                <div style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
                  <div style={{ marginBottom: 4 }}>
                    <b>Highlight Tweet:</b>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <i>@{d.highlight.username}</i>
                  </div>
                  <div style={{ marginBottom: 4 }}>{d.highlight.text}</div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Smart Following: {d.highlight.smartFollowingCount}
                  </div>
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
              },
            ]}
            fill={colors[i % colors.length]}
            shape={CustomShape}
          />
        ))}
        <Legend />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default VisualizationTab;
