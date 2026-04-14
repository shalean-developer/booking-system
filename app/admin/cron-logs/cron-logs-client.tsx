"use client";

import { useEffect, useMemo, useState } from "react";

type CronLog = {
  id: string;
  type: string | null;
  status: string | null;
  message: string | null;
  slug: string | null;
  created_at: string | null;
};

type CronLogsClientProps = {
  logs: CronLog[];
};

export function CronLogsClient({ logs }: CronLogsClientProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "blog" | "update">("all");

  useEffect(() => {
    const interval = window.setInterval(() => {
      window.location.reload();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const statusMatch = statusFilter === "all" || log.status === statusFilter;
      const typeMatch = typeFilter === "all" || log.type === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [logs, statusFilter, typeFilter]);

  const todayStats = useMemo(() => {
    const today = new Date();
    const isSameLocalDay = (value: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    };

    const todayLogs = logs.filter((log) => isSameLocalDay(log.created_at));
    const successCount = todayLogs.filter((log) => log.status === "success").length;
    const failureCount = todayLogs.filter((log) => log.status === "failed").length;
    const successRate = todayLogs.length
      ? Math.round((successCount / todayLogs.length) * 100)
      : 0;

    return {
      totalRunsToday: todayLogs.length,
      successCount,
      failureCount,
      successRate
    };
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Total runs today</p>
          <p className="text-xl font-semibold">{todayStats.totalRunsToday}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Success %</p>
          <p className="text-xl font-semibold text-green-600">{todayStats.successRate}%</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Successes</p>
          <p className="text-xl font-semibold">{todayStats.successCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Failures</p>
          <p className="text-xl font-semibold text-red-600">{todayStats.failureCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <label className="text-sm font-medium">
          Status
          <select
            className="ml-2 rounded border px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "success" | "failed")
            }
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Type
          <select
            className="ml-2 rounded border px-2 py-1 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "blog" | "update")}
          >
            <option value="all">All</option>
            <option value="blog">Blog</option>
            <option value="update">Update</option>
          </select>
        </label>

        <p className="text-xs text-gray-500">Auto-refreshes every 30 seconds</p>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{log.type ?? "unknown"}</span>
              <span
                className={`text-sm ${
                  log.status === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {log.status ?? "unknown"}
              </span>
            </div>

            <p className="mt-2 text-sm">{log.message ?? "No message"}</p>

            {log.slug && (
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xs text-gray-500">/blog/{log.slug}</p>
                <a
                  href={`/blog/${log.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View Post
                </a>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">
              {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
