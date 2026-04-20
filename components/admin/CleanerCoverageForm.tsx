'use client';

import { useState, useEffect } from 'react';

type Props = {
  cleanerId: string;
  initialWorkingAreas: string[];
  initialRadiusKm: number;
  initialBaseLat?: number | null;
  initialBaseLng?: number | null;
  onSaved?: () => void;
};

/**
 * Admin form: working areas (comma-separated), coverage radius, optional base coordinates.
 * Persists via PATCH /api/admin/cleaners/:id
 */
export function CleanerCoverageForm({
  cleanerId,
  initialWorkingAreas,
  initialRadiusKm,
  initialBaseLat,
  initialBaseLng,
  onSaved,
}: Props) {
  const [areasText, setAreasText] = useState(initialWorkingAreas.join(', '));
  const [radius, setRadius] = useState(String(initialRadiusKm));
  const [lat, setLat] = useState(initialBaseLat != null ? String(initialBaseLat) : '');
  const [lng, setLng] = useState(initialBaseLng != null ? String(initialBaseLng) : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const areasKey = JSON.stringify(initialWorkingAreas);

  useEffect(() => {
    setAreasText(initialWorkingAreas.join(', '));
    setRadius(String(initialRadiusKm));
    setLat(initialBaseLat != null ? String(initialBaseLat) : '');
    setLng(initialBaseLng != null ? String(initialBaseLng) : '');
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- areasKey tracks `initialWorkingAreas` content
  }, [cleanerId, areasKey, initialRadiusKm, initialBaseLat, initialBaseLng]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const working_areas = areasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const coverage_radius_km = Math.max(1, Math.min(200, parseInt(radius, 10) || 10));
      const body: Record<string, unknown> = {
        working_areas,
        coverage_radius_km,
      };
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      if (Number.isFinite(latN) && Number.isFinite(lngN)) {
        body.base_latitude = latN;
        body.base_longitude = lngN;
      }

      const res = await fetch(`/api/admin/cleaners/${cleanerId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage(data.error || 'Save failed');
        return;
      }
      setMessage('Saved');
      onSaved?.();
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Coverage</h3>
      <p className="mt-1 text-xs text-gray-500">
        Working areas (suburbs) and radius control which jobs appear in matching.
      </p>

      <label className="mt-3 block text-xs font-medium text-gray-700">Working areas</label>
      <input
        type="text"
        value={areasText}
        onChange={(e) => setAreasText(e.target.value)}
        placeholder="e.g. Sea Point, Camps Bay"
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      <label className="mt-3 block text-xs font-medium text-gray-700">Coverage radius (km)</label>
      <input
        type="number"
        min={1}
        max={200}
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        className="mt-1 w-full max-w-[12rem] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      <p className="mt-3 text-xs font-medium text-gray-700">Base location (optional, WGS84)</p>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {message ? <p className="mt-2 text-xs text-gray-600">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save coverage'}
      </button>
    </form>
  );
}
