import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const svc = createServiceClient();
  // Simple server-side filters via search params
  // Note: Using URLSearchParams on server via headers.referer is unreliable; keep API simple.
  const { data } = await svc
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-xl font-semibold mb-4">Notification Logs</h1>

      <form
        method="GET"
        action="/api/admin/notifications/logs"
        className="mb-4 flex flex-wrap gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Channel</label>
          <input name="channel" placeholder="whatsapp/email" className="border px-2 py-1 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status code</label>
          <input name="status" placeholder="e.g. 200" className="border px-2 py-1 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Booking ID</label>
          <input name="booking_id" className="border px-2 py-1 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Limit</label>
          <input name="limit" defaultValue="100" className="border px-2 py-1 rounded text-sm w-24" />
        </div>
        <button className="bg-gray-900 text-white text-sm px-3 py-2 rounded" type="submit">
          Open as JSON
        </button>
      </form>

      <div className="overflow-auto border border-gray-200 rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Channel</th>
              <th className="px-3 py-2 text-left">Template</th>
              <th className="px-3 py-2 text-left">Recipient</th>
              <th className="px-3 py-2 text-left">Booking</th>
              <th className="px-3 py-2 text-left">OK</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Error</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 text-gray-700">{new Date(row.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{row.channel}</td>
                <td className="px-3 py-2">{row.template}</td>
                <td className="px-3 py-2">
                  {row.recipient_type}:{' '}
                  {row.recipient_phone || row.recipient_email || '-'}
                </td>
                <td className="px-3 py-2">{row.booking_id || '-'}</td>
                <td className="px-3 py-2">{row.ok ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{row.status ?? '-'}</td>
                <td className="px-3 py-2 text-red-600">{row.error || '-'}</td>
                <td className="px-3 py-2">
                  <form action="/api/admin/notifications/resend" method="POST">
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      className="text-blue-600 hover:underline mr-3"
                      formAction="/api/admin/notifications/resend"
                      onClick={async (e) => {
                        e.preventDefault();
                        await fetch('/api/admin/notifications/resend', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: row.id }),
                        });
                        // soft reload
                        if (typeof window !== 'undefined') window.location.reload();
                      }}
                      type="button"
                    >
                      Resend
                    </button>
                    <button
                      className="text-gray-600 hover:underline"
                      type="button"
                      onClick={() => {
                        const payload = row.payload || {};
                        let preview = '';
                        try {
                          const comp = (payload.components || [])[0];
                          const bodyParams = comp?.parameters || [];
                          preview = (bodyParams || []).map((p: any) => p?.text).filter(Boolean).join(' | ');
                        } catch {}
                        alert(preview || JSON.stringify(row.payload, null, 2));
                      }}
                    >
                      Preview
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


