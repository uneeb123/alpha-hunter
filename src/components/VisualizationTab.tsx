'use client';

import React, { useState, useEffect } from 'react';
import { UMAP } from 'umap-js';
import { kmeans } from 'ml-kmeans';
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
    async function fetchAndProcess() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/visualization/tweet-embeddings');
        const vectors = await res.json();
        if (!Array.isArray(vectors) || vectors.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }
        // 1. UMAP to 2D
        const umap = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
        const coords = umap.fit(vectors.map((v: any) => v.values));
        // 2. KMeans clustering (choose k by sqrt(N/2), min 2, max 10)
        const k = Math.max(
          2,
          Math.min(10, Math.round(Math.sqrt(vectors.length / 2))),
        );
        const kmeansResult = kmeans(coords, k, {});
        // 3. Assign cluster numbers
        const clusterLabels = kmeansResult.clusters;
        // 4. Prepare data for recharts (no label/keyword)
        const chartData = coords.map(([x, y]: number[], i: number) => ({
          x,
          y,
          cluster: clusterLabels[i],
          text: vectors[i].text,
          username: vectors[i].metadata?.username,
          timestamp: vectors[i].timestamp,
        }));
        setData(chartData);
      } catch {
        setError('Failed to load visualization data');
      } finally {
        setLoading(false);
      }
    }
    fetchAndProcess();
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

  // Find number of clusters
  const numClusters = Math.max(...data.map((d) => d.cluster)) + 1;

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
        <XAxis type="number" dataKey="x" name="UMAP-1" />
        <YAxis type="number" dataKey="y" name="UMAP-2" />
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
                  <b>User:</b> {d.username}
                </div>
                <div>
                  <b>Text:</b>{' '}
                  {typeof d.text === 'string' ? (
                    <>
                      {d.text.slice(0, 120)}
                      {d.text.length > 120 ? '...' : ''}
                    </>
                  ) : (
                    <i>No text</i>
                  )}
                </div>
                <div>
                  <b>Timestamp:</b>{' '}
                  {d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}
                </div>
              </div>
            );
          }}
        />
        {[...Array(numClusters)].map((_, i) => (
          <Scatter
            key={i}
            name={`Cluster ${i}`}
            data={data.filter((d) => d.cluster === i)}
            fill={colors[i % colors.length]}
          />
        ))}
        <Legend />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default VisualizationTab;
