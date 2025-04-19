'use client';

import { createChart, Time } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface ChartProps {
  trades: {
    time: Time;
    value: number;
  }[];
}

export default function TradingChart({ trades }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC',
          });
          return date;
        },
      },
    });

    const series = chart.addHistogramSeries({
      color: '#26a69a',
      base: 0,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Color the bars based on value
    const coloredTrades = trades.map((trade) => ({
      ...trade,
      color: trade.value >= 0 ? '#26a69a' : '#ef5350',
    }));

    series.setData(coloredTrades);
    chart.timeScale().fitContent();

    // Set initial size
    chart.applyOptions({
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
    });

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trades]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}
