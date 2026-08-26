import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
}

export default function DashboardStatCard({
    title,
    value,
    icon,
    trend,
}: DashboardStatCardProps) {

    const getTrendStyle = (trend?: string) => {
        if (!trend) {
            return {
            color: "text-slate-500 dark:text-slate-400",
            icon: Minus,
            };
        }

        if (trend.includes("+")) {
            return {
            color: "text-emerald-600 dark:text-emerald-400",
            icon: TrendingUp,
            };
        }

        if (trend.includes("-")) {
            return {
            color: "text-red-600 dark:text-red-400",
            icon: TrendingDown,
            };
        }

        return {
            color: "text-slate-500 dark:text-slate-400",
            icon: Minus,
        };
    };

    const { color: trendColor, icon: TrendIcon } = getTrendStyle(trend);

    return (
        <div
            className="
                group
                rounded-2xl
                border border-neutral-300 dark:border-neutral-600
                bg-neutral-100 dark:bg-neutral-800
                p-4 sm:p-5 lg:p-6
                shadow-sm
                transition-all duration-300
                hover:-tranneutral-y-1
                hover:shadow-xl
            "
            >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {title}
                </p>

                <h2 className="mt-2 truncate text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
                    {value}
                </h2>

                {trend && (
                    <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span>{trend}</span>
                    </div>
                )}
                </div>

                <div
                className="
                    flex h-12 w-12 shrink-0 items-center justify-center
                    rounded-xl
                    bg-neutral-100 text-neutral-700
                    dark:bg-neutral-800 dark:text-neutral-300
                    transition-colors
                    group-hover:bg-blue-100
                    group-hover:text-blue-600
                    dark:group-hover:bg-blue-900/30
                    dark:group-hover:text-blue-400
                "
                >
                {icon}
                </div>
            </div>
        </div>
    );
}