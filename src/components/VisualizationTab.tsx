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

// Add custom shape component
const CustomShape = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.radius * 50} // Scale the radius for better visualization
      fill={props.fill}
      fillOpacity={0.2}
    />
  );
};

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

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
        <XAxis type="number" dataKey="centroid.x" name="UMAP-1" />
        <YAxis type="number" dataKey="centroid.y" name="UMAP-2" />
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
                }}
              >
                <div>
                  <b>Cluster:</b> {d.cluster}
                </div>
                <div>
                  <b>Points:</b> {d.count}
                </div>
                <div>
                  <b>Radius:</b> {d.radius.toFixed(2)}
                </div>
              </div>
            );
          }}
        />
        {data.map((cluster, i) => (
          <Scatter
            key={i}
            name={`Cluster ${i}`}
            data={[
              {
                centroid: cluster.centroid,
                radius: cluster.radius,
                cluster: cluster.cluster,
                count: cluster.count,
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
