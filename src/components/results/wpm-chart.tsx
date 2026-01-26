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
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { cn } from '@/lib/utils/cn';

// Register Chart.js components
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

interface WpmChartProps {
  wpmHistory: { timestamp: number; wpm: number; raw: number; errors: number }[];
  className?: string;
}

// Helper function to get CSS variable value
function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') {
    // Default fallbacks for SSR
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

// Helper function to convert hex/rgb to rgba
function colorWithAlpha(color: string, alpha: number): string {
  // If it's already rgba, just return it
  if (color.startsWith('rgba')) {
    return color;
  }

  // If it's rgb, convert to rgba
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }

  // If it's hex, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

export function WpmChart({ wpmHistory, className }: WpmChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [themeKey, setThemeKey] = useState(0);

  // Get theme colors
  const getThemeColors = useCallback(() => ({
    mainColor: getCSSVariable('--main-color'),
    subColor: getCSSVariable('--sub-color'),
    subAltColor: getCSSVariable('--sub-alt-color'),
    textColor: getCSSVariable('--text-color'),
    bgColor: getCSSVariable('--bg-color'),
    errorColor: getCSSVariable('--error-color'),
  }), []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          // Force re-render when theme changes
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
    const labels = wpmHistory.map((_, index) => `${index + 1}s`);
    const colors = getThemeColors();

    return {
      labels,
      datasets: [
        {
          label: 'WPM',
          data: wpmHistory.map((point) => point.wpm),
          borderColor: colors.mainColor,
          backgroundColor: colorWithAlpha(colors.mainColor, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: colors.mainColor,
          pointHoverBorderColor: colors.bgColor,
          pointHoverBorderWidth: 2,
        },
        {
          label: 'Raw WPM',
          data: wpmHistory.map((point) => point.raw),
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
        {
          label: 'Errors',
          data: wpmHistory.map((point) => point.errors),
          borderColor: colors.errorColor,
          backgroundColor: colorWithAlpha(colors.errorColor, 0.1),
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: colors.errorColor,
          pointHoverBorderColor: colors.bgColor,
          pointHoverBorderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [wpmHistory, themeKey, getThemeColors]);

  const chartOptions = useMemo((): ChartOptions<'line'> => {
    const colors = getThemeColors();
    const gridColor = colorWithAlpha(colors.subColor, 0.3);

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
          displayColors: true,
          callbacks: {
            title: (context) => `Second ${context[0].label}`,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null) {
                return `${label}: N/A`;
              }
              if (label === 'Errors') {
                return `${label}: ${value}`;
              }
              return `${label}: ${Math.round(value)} wpm`;
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
          border: {
            display: false,
          },
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
          position: 'left',
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
          border: {
            display: false,
          },
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
        y1: {
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Errors',
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 11,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: colors.subColor,
            font: {
              family: "'Roboto Mono', monospace",
              size: 10,
            },
            padding: 8,
            stepSize: 1,
          },
          beginAtZero: true,
        },
      },
    };
  }, [themeKey, getThemeColors]);

  if (wpmHistory.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center h-64 rounded-lg',
        'bg-sub-alt border border-sub/50',
        className
      )}>
        <p className="text-sub text-sm font-mono">No chart data available</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative w-full h-64 p-4 rounded-lg',
      'bg-sub-alt border border-sub/50',
      className
    )}>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
}
