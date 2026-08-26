import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Bar,
  Line,
  Doughnut,
  Pie,
  Radar,
  PolarArea,
} from "react-chartjs-2";

import type { ChartData, ChartOptions, ChartTypeRegistry } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

type ChartType =
  | "bar"
  | "line"
  | "doughnut"
  | "pie"
  | "radar"
  | "polarArea";

interface FilterOption {
  label: string;
  value: string;
}

interface DashboardChartProps {
  title: string;
  data: ChartData<keyof ChartTypeRegistry, number[], unknown>;
  types?: ChartType[];
  defaultType?: ChartType;
  filters?: FilterOption[];
  defaultFilter?: string;
  onFilterChange?: (value: string) => ChartData<
    keyof ChartTypeRegistry,
    number[],
    unknown
  >;
}

export default function DashboardChart({
  title,
  data,
  types = ["bar", "line"],
  defaultType = "bar",
  filters,
  defaultFilter = "all",
  onFilterChange,
}: DashboardChartProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultType);
  const [filter, setFilter] = useState(defaultFilter);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.classList.contains("dark")
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const chartData = useMemo(() => {
    return onFilterChange ? onFilterChange(filter) : data;
  }, [filter, data, onFilterChange]);

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: isDark ? "#d1d5db" : "#374151",
          font: {
            size: 11,
          },
        },
      },
    },

    scales: ["pie", "doughnut", "polarArea"].includes(chartType)
      ? undefined
      : {
          x: {
            ticks: {
              color: isDark ? "#d1d5db" : "#374151",
            },
            grid: {
              color: isDark
                ? "rgba(255,255,255,.07)"
                : "rgba(0,0,0,.07)",
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: isDark ? "#d1d5db" : "#374151",
            },
            grid: {
              color: isDark
                ? "rgba(255,255,255,.07)"
                : "rgba(0,0,0,.07)",
            },
          },
        },
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    doughnut: Doughnut,
    pie: Pie,
    radar: Radar,
    polarArea: PolarArea,
  }[chartType] as React.ComponentType<any>;

  return (
    <div className="rounded-2xl border border-neutral-300 bg-100 p-5 shadow-sm dark:border-neutral-600 dark:bg-neutral-800">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {title}
        </h2>

        <div className="flex flex-wrap gap-2">
          {filters && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              {filters.map((item) => (
                <option key={item.value} value={item.value} className="cursor-pointer">
                  {item.label}
                </option>
              ))}
            </select>
          )}

          {types.map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                chartType === type
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ChartComponent data={chartData} options={options} />
      </div>
    </div>
  );
}