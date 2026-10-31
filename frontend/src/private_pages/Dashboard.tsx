import axios from "axios";
import { useEffect, useState } from "react";
import type { ChartData, ChartTypeRegistry } from "chart.js";
import {
  AlertTriangle,
  Boxes,
  BriefcaseBusiness,
  ClipboardCheck,
  Users,
  UserCheck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardStatCard from "../components/Dashboard/StatCard";
import DashboardChart from "../components/Dashboard/Chart";

interface DashboardMetric {
  title: string;
  value: string;
  icon: string;
  trend: string | null;
}

interface DashboardChartData {
  title: string;
  chart_type: "doughnut" | "bar";
  labels: string[];
  values: number[];
}

interface DashboardData {
  role: string;
  metrics: DashboardMetric[];
  charts: DashboardChartData[];
}

const metricIcons: Record<string, LucideIcon> = {
  users: Users,
  assets: Boxes,
  tasks: ClipboardCheck,
  alert: AlertTriangle,
  people: UserCheck,
  wrench: Wrench,
};

const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#ef4444", "#0891b2"];

function getChartData(chart: DashboardChartData): ChartData<keyof ChartTypeRegistry, number[], unknown> {
  const isDoughnut = chart.chart_type === "doughnut";
  return {
    labels: chart.labels,
    datasets: [
      {
        label: chart.title,
        data: chart.values,
        backgroundColor: isDoughnut ? chartColors : "rgba(37, 99, 235, .65)",
        borderColor: isDoughnut ? chartColors : "#2563eb",
        borderWidth: 2,
        borderRadius: isDoughnut ? undefined : 6,
      },
    ],
  };
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<DashboardData>(
          `${import.meta.env.VITE_API_URL}/api/dashboard`,
          { withCredentials: true, signal: controller.signal },
        );
        setDashboard(response.data);
      } catch (requestError: unknown) {
        if (controller.signal.aborted) return;
        const detail = axios.isAxiosError(requestError)
          ? requestError.response?.data?.detail ?? requestError.response?.data?.message
          : null;
        setError(typeof detail === "string" ? detail : "Dashboard data could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchDashboard();
    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return <div className="rounded-2xl bg-gray-50 p-8 text-center text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">Loading dashboard...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-700 dark:text-red-300">{error ?? "Dashboard data is unavailable."}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const charts = dashboard.charts.filter((chart) => chart.labels.length > 0).slice(0, 2);

  return (
    <section>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{dashboard.role} Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          A current overview of the information relevant to your role.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboard.metrics.map((metric) => {
          const Icon = metricIcons[metric.icon] ?? BriefcaseBusiness;
          return (
            <DashboardStatCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={<Icon className="h-6 w-6" />}
              trend={metric.trend ?? undefined}
            />
          );
        })}
      </div>

      {charts.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {charts.map((chart) => (
            <DashboardChart
              key={chart.title}
              title={chart.title}
              types={chart.chart_type === "doughnut" ? ["doughnut", "pie", "polarArea"] : ["bar", "line"]}
              defaultType={chart.chart_type}
              data={getChartData(chart)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-gray-50 p-5 text-center text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          There is not enough data to display charts yet.
        </p>
      )}
    </section>
  );
}
