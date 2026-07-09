'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CleanerCoverageForm } from '@/components/admin/CleanerCoverageForm';
import { PageHeader } from '@/components/admin/shared/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Calendar, Loader2, MapPin, TrendingUp } from 'lucide-react';

type CleanerDetail = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  areas?: string[];
  working_areas?: string[];
  coverage_radius_km?: number;
  base_latitude?: number | null;
  base_longitude?: number | null;
  auth_provider?: string;
  is_active?: boolean;
  is_available?: boolean;
  total_bookings?: number;
  completed_bookings?: number;
  total_revenue?: number;
  average_rating?: number | null;
  created_at?: string;
};

function displayName(c: CleanerDetail) {
  if (c.name?.trim()) return c.name.trim();
  const n = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
  return n || 'Cleaner';
}

function nameForEdit(c: CleanerDetail) {
  if (c.name?.trim()) return c.name.trim();
  return [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
}

export default function AdminCleanerDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [cleaner, setCleaner] = useState<CleanerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState({ name: '', email: '', phone: '', areasStr: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [coverageKey, setCoverageKey] = useState(0);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const loadCleaner = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!id) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/cleaners/${encodeURIComponent(id)}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; cleaner?: CleanerDetail };
        if (!res.ok || !data.ok || !data.cleaner) {
          setError(data.error || (res.status === 404 ? 'Cleaner not found' : 'Failed to load'));
          setCleaner(null);
        } else {
          setCleaner(data.cleaner);
          setError(null);
        }
      } catch {
        setError('Failed to load cleaner');
        setCleaner(null);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Invalid cleaner id');
      return;
    }
    void loadCleaner();
  }, [id, loadCleaner]);

  useEffect(() => {
    if (!cleaner) return;
    setDraft({
      name: nameForEdit(cleaner),
      email: cleaner.email ?? '',
      phone: cleaner.phone ?? '',
      areasStr: (cleaner.areas ?? []).join(', '),
    });
    setFormError(null);
  }, [cleaner]);

  async function patchJson(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/cleaners/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Update failed');
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const areas = draft.areasStr
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    if (!draft.name.trim() || !draft.phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }
    if (areas.length === 0) {
      setFormError('At least one legacy service area is required (comma-separated).');
      return;
    }
    setProfileSaving(true);
    try {
      await patchJson({
        name: draft.name.trim(),
        email: draft.email.trim() || undefined,
        phone: draft.phone,
        areas,
      });
      await loadCleaner({ silent: true });
      setCoverageKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  }

  async function setActive(active: boolean) {
    setStatusSaving(true);
    setFormError(null);
    try {
      await patchJson({ is_active: active });
      await loadCleaner({ silent: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusSaving(false);
      setDeactivateOpen(false);
    }
  }

  async function handleApprove() {
    await setActive(true);
  }

  async function handleAvailability(next: boolean) {
    setAvailabilitySaving(true);
    setFormError(null);
    try {
      await patchJson({ is_available: next });
      await loadCleaner({ silent: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setAvailabilitySaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">Loading cleaner…</div>
    );
  }

  if (error || !cleaner) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <p className="text-red-600">{error || 'Cleaner not found'}</p>
        <Button asChild variant="outline">
          <Link href="/admin/cleaners">Back to cleaners</Link>
        </Button>
      </div>
    );
  }

  const title = displayName(cleaner);
  const areas = (cleaner.working_areas?.length ? cleaner.working_areas : cleaner.areas) ?? [];
  const revenueZar =
    typeof cleaner.total_revenue === 'number' && cleaner.total_revenue > 0
      ? `R ${(cleaner.total_revenue / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  const workingForForm = cleaner.working_areas?.length ? cleaner.working_areas : cleaner.areas ?? [];
  const radiusKm = typeof cleaner.coverage_radius_km === 'number' ? cleaner.coverage_radius_km : 10;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/cleaners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All cleaners
          </Link>
        </Button>
      </div>

      <PageHeader
        title={title}
        description="Edit profile, approval, coverage, and quick links"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cleaners', href: '/admin/cleaners' },
          { label: title },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/cleaners/performance?cleaner=${encodeURIComponent(cleaner.id)}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/admin/schedule?cleanerId=${encodeURIComponent(cleaner.id)}&cleanerName=${encodeURIComponent(title)}`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Jobs', value: String(cleaner.total_bookings ?? 0) },
          { label: 'Completed', value: String(cleaner.completed_bookings ?? 0) },
          { label: 'Revenue (payout)', value: revenueZar },
          {
            label: 'Rating',
            value:
              cleaner.average_rating != null && cleaner.average_rating > 0
                ? cleaner.average_rating.toFixed(1)
                : '—',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account status</h2>
            <p className="text-sm text-gray-500">
              Approve activates the account (dashboard access). Deactivate blocks sign-in until approved again.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cleaner.is_active ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={statusSaving}
                onClick={() => setDeactivateOpen(true)}
              >
                {statusSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Deactivate
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={statusSaving} onClick={() => void handleApprove()}>
                {statusSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Approve &amp; activate
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cleaner.is_active ? 'border-green-200 bg-green-50 text-green-800' : ''}>
            {cleaner.is_active ? 'Approved / active' : 'Inactive / declined'}
          </Badge>
        </div>
        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Available for new jobs</p>
            <p className="text-xs text-gray-500">When off, the cleaner stays approved but won&apos;t be matched for new work.</p>
          </div>
          <div className="flex items-center gap-2">
            {availabilitySaving ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
            <Switch
              checked={!!cleaner.is_available}
              disabled={availabilitySaving || !cleaner.is_active}
              onCheckedChange={(v) => void handleAvailability(v)}
              aria-label="Available for jobs"
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSaveProfile(e)}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900">Edit profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cleaner-name">Full name</Label>
            <Input
              id="cleaner-name"
              className="mt-1"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="cleaner-email">Email</Label>
            <Input
              id="cleaner-email"
              type="email"
              className="mt-1"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="cleaner-phone">Phone</Label>
            <Input
              id="cleaner-phone"
              className="mt-1"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              autoComplete="tel"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cleaner-areas">Legacy service areas (comma-separated)</Label>
            <Input
              id="cleaner-areas"
              className="mt-1"
              value={draft.areasStr}
              onChange={(e) => setDraft((d) => ({ ...d, areasStr: e.target.value }))}
              placeholder="e.g. Cape Town, Sea Point"
            />
            <p className="mt-1 text-xs text-gray-500">
              Required for routing when named working areas below are empty. Use coverage below for suburb-level matching.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={profileSaving}>
          {profileSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save profile'
          )}
        </Button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-gray-400" />
          Working areas &amp; coverage
        </h2>
        <p className="text-sm text-gray-500">
          Named suburbs and radius drive job matching. Save updates the cleaner immediately.
        </p>
        {areas.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a}>
                <Badge variant="secondary">{a}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No named areas yet—add suburbs below or rely on legacy areas from the profile section.
          </p>
        )}
        <CleanerCoverageForm
          key={coverageKey}
          cleanerId={cleaner.id}
          initialWorkingAreas={workingForForm}
          initialRadiusKm={radiusKm}
          initialBaseLat={cleaner.base_latitude}
          initialBaseLng={cleaner.base_longitude}
          onSaved={() => void loadCleaner({ silent: true })}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">Dashboard login:</span>{' '}
          {cleaner.auth_provider ?? '—'}
        </p>
      </div>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this cleaner?</AlertDialogTitle>
            <AlertDialogDescription>
              They will not be able to sign in until you approve the account again. You can reactivate anytime from this
              page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={() => void setActive(false)}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
