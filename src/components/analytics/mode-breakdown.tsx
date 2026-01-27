'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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

interface ModeBreakdownProps {
  data: { mode: string; avg_wpm: number; best_wpm: number; tests: number }[];
  className?: string;
}

export function ModeBreakdown({ data, className }: ModeBreakdownProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [themeKey, setThemeKey] = useState(0);

  const getThemeColors = useCallback(() => ({
    mainColor: getCSSVariable('--main-color'),
    subColor: getCSSVariable('--sub-color'),
    subAltColor: getCSSVariable('--sub-alt-color'),
    textColor: getCSSVariable('--text-color'),
    bgColor: getCSSVariable('--bg-color'),
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

  const chartData = useMemo((): ChartData<'bar'> => {
    const colors = getThemeColors();
    const labels = data.map(d => d.mode.charAt(0).toUpperCase() + d.mode.slice(1));

    return {
      labels,
      datasets: [
        {
          label: 'Average WPM',
          data: data.map(d => d.avg_wpm),
          backgroundColor: colorWithAlpha(colors.mainColor, 0.7),
          borderColor: colors.mainColor,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Best WPM',
          data: data.map(d => d.best_wpm),
          backgroundColor: colorWithAlpha(colors.textColor, 0.3),
          borderColor: colorWithAlpha(colors.textColor, 0.5),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [data, themeKey, getThemeColors]);

  const chartOptions = useMemo((): ChartOptions<'bar'> => {
    const colors = getThemeColors();
    const gridColor = colorWithAlpha(colors.subColor, 0.15);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: colors.subColor,
            usePointStyle: true,
            pointStyle: 'rect',
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
            afterBody: (context) => {
              const idx = context[0].dataIndex;
              const item = data[idx];
              if (item) {
                return `Tests: ${item.tests}`;
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 11,
            },
          },
        },
        y: {
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
          No mode data available yet.
        </p>
      </div>
    );
  }

  // If there's data, show both chart and stat cards
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Bar chart */}
      <div
        className="relative w-full h-64 p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
        }}
      >
        <Bar ref={chartRef} data={chartData} options={chartOptions} />
      </div>

      {/* Stat cards per mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((mode) => (
          <div
            key={mode.mode}
            className="rounded-lg border p-3"
            style={{
              backgroundColor: 'var(--sub-alt-color)',
              borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
            }}
          >
            <p
              className="text-xs uppercase tracking-wider font-medium mb-2"
              style={{ color: 'var(--sub-color)' }}
            >
              {mode.mode}
            </p>
            <div className="flex items-baseline justify-between">
              <div>
                <span
                  className="text-lg font-bold font-mono"
                  style={{ color: 'var(--main-color)' }}
                >
                  {mode.avg_wpm}
                </span>
                <span
                  className="text-xs font-mono ml-1"
                  style={{ color: 'var(--sub-color)' }}
                >
                  avg wpm
                </span>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-mono"
                  style={{ color: 'var(--text-color)' }}
                >
                  {mode.best_wpm}
                </span>
                <span
                  className="text-xs font-mono ml-1"
                  style={{ color: 'var(--sub-color)' }}
                >
                  best
                </span>
              </div>
            </div>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: 'var(--sub-color)' }}
            >
              {mode.tests} test{mode.tests !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
