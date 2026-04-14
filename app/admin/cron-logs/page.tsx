import { createServiceClient } from "@/lib/supabase-server";
import { CronLogsClient } from "./cron-logs-client";

type CronLog = {
  id: string;
  type: string | null;
  status: string | null;
  message: string | null;
  slug: string | null;
  created_at: string | null;
};

export const dynamic = "force-dynamic";

export default async function CronLogsPage() {
  const supabase = createServiceClient();

  const { data: logs } = await supabase
    .from("cron_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Cron Logs</h1>
      <CronLogsClient logs={(logs as CronLog[] | null) ?? []} />
    </div>
  );
}
