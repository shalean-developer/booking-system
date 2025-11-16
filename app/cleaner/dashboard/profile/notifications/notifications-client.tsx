'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Bell } from 'lucide-react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
}

interface Preferences {
  email_opt_in: boolean;
  whatsapp_opt_in: boolean;
  email?: string | null;
  phone?: string | null;
}

interface NotificationsClientProps {
  cleaner: CleanerSession;
}

export function NotificationsClient({ cleaner }: NotificationsClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    email_opt_in: false,
    whatsapp_opt_in: false,
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch('/api/cleaner/notifications/preferences');
        const data = await res.json();
        if (res.ok && data.ok) {
          setPrefs({
            email_opt_in: !!data.preferences?.email_opt_in,
            whatsapp_opt_in: !!data.preferences?.whatsapp_opt_in,
            email: data.preferences?.email || '',
            phone: data.preferences?.phone || cleaner.phone || '',
          });
        } else {
          setError(data.error || 'Failed to load preferences');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [cleaner.phone]);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/cleaner/dashboard/profile" className="p-1">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <Bell className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">WhatsApp notifications</div>
                      <div className="text-xs text-gray-500">Job assignment, status updates, reminders</div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={prefs.whatsapp_opt_in}
                        onChange={(e) => setPrefs({ ...prefs, whatsapp_opt_in: e.target.checked })}
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#3b82f6] transition-colors relative">
                        <div className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${prefs.whatsapp_opt_in ? 'translate-x-4' : ''}`} />
                      </div>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="wa_phone" className="text-xs text-gray-600">WhatsApp number</Label>
                    <Input
                      id="wa_phone"
                      value={prefs.phone || ''}
                      onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
                      placeholder="+27..."
                    />
                    <div className="text-[11px] text-gray-500 mt-1">Use international format, e.g., +27...</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email notifications</div>
                      <div className="text-xs text-gray-500">Receipts and summaries</div>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={prefs.email_opt_in}
                        onChange={(e) => setPrefs({ ...prefs, email_opt_in: e.target.checked })}
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#3b82f6] transition-colors relative">
                        <div className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${prefs.email_opt_in ? 'translate-x-4' : ''}`} />
                      </div>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-xs text-gray-600">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={prefs.email || ''}
                      onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    setTesting(true);
                    setError(null);
                    try {
                      const res = await fetch('/api/cleaner/notifications/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: (prefs.phone || '').trim() }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send test');
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to send test message');
                    } finally {
                      setTesting(false);
                    }
                  }}
                  disabled={testing || !prefs.phone}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-70 mr-2"
                  type="button"
                >
                  {testing ? 'Sending test...' : 'Send test WhatsApp'}
                </button>
                <button
                  onClick={async () => {
                    setSaving(true);
                    setError(null);
                    try {
                      const res = await fetch('/api/cleaner/notifications/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email_opt_in: prefs.email_opt_in,
                          whatsapp_opt_in: prefs.whatsapp_opt_in,
                          email: (prefs.email || '').trim(),
                          phone: (prefs.phone || '').trim(),
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save');
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to save preferences');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="rounded-md bg-[#3b82f6] text-white px-4 py-2 text-sm hover:bg-[#2563eb] disabled:opacity-70"
                  type="button"
                >
                  {saving ? 'Saving...' : 'Save preferences'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <CleanerMobileBottomNav />
      <div className="h-20 sm:h-0" />
    </div>
  );
}


