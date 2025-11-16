export const dynamic = 'force-dynamic';

export default function CustomerNotificationsPreferencesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Notifications preferences</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your booking reference and email to manage WhatsApp notifications.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            const bookingId = String(fd.get('bookingId') || '');
            const email = String(fd.get('email') || '');
            const whatsapp_opt_in = fd.get('whatsapp') === 'on';
            const res = await fetch('/api/customer/notifications/preferences', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId, email, whatsapp_opt_in }),
            });
            const data = await res.json();
            alert(data.ok ? 'Saved' : `Error: ${data.error || 'Failed to save'}`);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-600 mb-1">Booking reference</label>
            <input name="bookingId" className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input type="email" name="email" className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div className="flex items-center gap-2">
            <input id="whatsapp" name="whatsapp" type="checkbox" className="h-4 w-4" />
            <label htmlFor="whatsapp" className="text-sm text-gray-700">
              Receive WhatsApp updates for this booking
            </label>
          </div>
          <button
            type="submit"
            className="rounded-md bg-[#3b82f6] text-white px-4 py-2 text-sm hover:bg-[#2563eb]"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}


