'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') {
    const defaults: Record<string, string> = {
      '--main-color': '#e2b714',
      '--sub-color': '#646669',
      '--sub-alt-color': '#2c2e31',
      '--text-color': '#d1d0c5',
      '--bg-color': '#323437',
      '--error-color': '#ca4754',
    };
    return defaults[variableName] || '#646669';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) return color;
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

interface WpmProgressionChartProps {
  data: { wpm: number; raw_wpm: number; accuracy: number; date: string; test_mode: string }[];
  className?: string;
}

export function WpmProgressionChart({ data, className }: WpmProgressionChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [themeKey, setThemeKey] = useState(0);

  const getThemeColors = useCallback(() => ({
    mainColor: getCSSVariable('--main-color'),
    subColor: getCSSVariable('--sub-color'),
    subAltColor: getCSSVariable('--sub-alt-color'),
    textColor: getCSSVariable('--text-color'),
    bgColor: getCSSVariable('--bg-color'),
    errorColor: getCSSVariable('--error-color'),
  }), []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          setThemeKey((prev) => prev + 1);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const chartData = useMemo((): ChartData<'line'> => {
    const colors = getThemeColors();
    const labels = data.map((_, i) => `#${i + 1}`);

    return {
      labels,
      datasets: [
        {
          label: 'WPM',
          data: data.map(d => d.wpm),
          borderColor: colors.mainColor,
          backgroundColor: colorWithAlpha(colors.mainColor, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: data.length > 50 ? 0 : 2,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: colors.mainColor,
          pointHoverBorderColor: colors.bgColor,
          pointHoverBorderWidth: 2,
        },
        {
          label: 'Raw WPM',
          data: data.map(d => d.raw_wpm),
          borderColor: colors.subColor,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: colors.subColor,
          pointHoverBorderColor: colors.bgColor,
          pointHoverBorderWidth: 2,
        },
      ],
    };
  }, [data, themeKey, getThemeColors]);

  const chartOptions = useMemo((): ChartOptions<'line'> => {
    const colors = getThemeColors();
    const gridColor = colorWithAlpha(colors.subColor, 0.15);

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: colors.subColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: {
              family: "'Roboto Mono', monospace",
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: colorWithAlpha(colors.bgColor, 0.95),
          titleColor: colors.textColor,
          bodyColor: colors.subColor,
          borderColor: colors.subColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: "'Roboto Mono', monospace",
            size: 12,
            weight: 'bold',
          },
          bodyFont: {
            family: "'Roboto Mono', monospace",
            size: 11,
          },
          callbacks: {
            title: (context) => {
              const idx = context[0].dataIndex;
              const item = data[idx];
              if (item) {
                const dateStr = new Date(item.date).toLocaleDateString();
                return `Test #${idx + 1} - ${dateStr}`;
              }
              return `Test #${idx + 1}`;
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const v = value ?? 0;
              return `${label}: ${Math.round(v)} wpm`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 10,
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 15,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'WPM',
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 11,
            },
          },
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 10,
            },
            padding: 8,
          },
          beginAtZero: true,
        },
      },
    };
  }, [data, themeKey, getThemeColors]);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 rounded-lg border ${className || ''}`}
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
        }}
      >
        <p className="text-sm font-mono" style={{ color: 'var(--sub-color)' }}>
          No data available yet. Complete some tests to see your WPM progression.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-72 p-4 rounded-lg border ${className || ''}`}
      style={{
        backgroundColor: 'var(--sub-alt-color)',
        borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
      }}
    >
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
}
