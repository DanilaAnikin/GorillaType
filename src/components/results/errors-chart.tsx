'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils/cn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ErrorsChartProps {
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

export function ErrorsChart({ wpmHistory, className }: ErrorsChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);
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

  // Calculate errors per second (delta between consecutive snapshots)
  const errorsPerSecond = useMemo(() => {
    if (wpmHistory.length === 0) return [];

    return wpmHistory.map((point, index) => {
      if (index === 0) {
        return point.errors; // First second shows initial errors
      }
      // Calculate delta from previous snapshot
      const prevErrors = wpmHistory[index - 1].errors;
      return Math.max(0, point.errors - prevErrors);
    });
  }, [wpmHistory]);

  // Calculate cumulative errors for the line overlay
  const cumulativeErrors = useMemo(() => {
    return wpmHistory.map((point) => point.errors);
  }, [wpmHistory]);

  const chartData = useMemo((): ChartData<'bar'> => {
    const labels = wpmHistory.map((_, index) => `${index + 1}s`);
    const colors = getThemeColors();

    return {
      labels,
      datasets: [
        {
          label: 'Errors/Second',
          data: errorsPerSecond,
          backgroundColor: colorWithAlpha(colors.errorColor, 0.7),
          borderColor: colors.errorColor,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
      ],
    };
  }, [wpmHistory, errorsPerSecond, themeKey, getThemeColors]);

  const chartOptions = useMemo((): ChartOptions<'bar'> => {
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
              return `${label}: ${value} error${value !== 1 ? 's' : ''}`;
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
            text: 'Errors',
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
            stepSize: 1,
          },
          beginAtZero: true,
        },
      },
    };
  }, [themeKey, getThemeColors]);

  // Check if there are any errors to display
  const totalErrors = cumulativeErrors.length > 0 ? cumulativeErrors[cumulativeErrors.length - 1] : 0;

  if (wpmHistory.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center h-48 rounded-lg',
        'bg-sub-alt border border-sub/50',
        className
      )}>
        <p className="text-sub text-sm font-mono">No chart data available</p>
      </div>
    );
  }

  if (totalErrors === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-48 rounded-lg gap-2',
        'bg-sub-alt border border-sub/50',
        className
      )}>
        <p className="text-main text-lg font-mono font-medium">Perfect!</p>
        <p className="text-sub text-sm font-mono">No errors during this test</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative w-full h-48 p-4 rounded-lg',
      'bg-sub-alt border border-sub/50',
      className
    )}>
      <Bar ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
}
