'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { ArrowLeft, Loader2, Save, Clock, Calendar, X, DollarSign, MapPin, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { CleanerSession } from '@/lib/cleaner-auth';

interface CleanerSessionProps {
  cleaner: CleanerSession;
}

interface AvailabilityPreferences {
  id?: string;
  cleaner_id: string;
  preferred_start_time: string | null;
  preferred_end_time: string | null;
  preferred_days_of_week: number[];
  blocked_dates: string[];
  blocked_time_slots: Array<{ date: string; start: string; end: string }>;
  availability_template: string | null;
  auto_decline_outside_availability: boolean;
  auto_decline_below_min_value: boolean;
  min_booking_value_cents: number | null;
  preferred_service_types: string[];
  max_distance_km: number | null;
  auto_accept_rules: Record<string, any>;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const SERVICE_TYPES = ['Standard', 'Deep', 'Move In/Out', 'Airbnb'];

export function AvailabilityClient({ cleaner }: CleanerSessionProps) {
  const [preferences, setPreferences] = useState<AvailabilityPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [preferredStartTime, setPreferredStartTime] = useState('08:00');
  const [preferredEndTime, setPreferredEndTime] = useState('17:00');
  const [preferredDays, setPreferredDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [autoDeclineOutside, setAutoDeclineOutside] = useState(false);
  const [autoDeclineMinValue, setAutoDeclineMinValue] = useState(false);
  const [minBookingValue, setMinBookingValue] = useState('');
  const [preferredServices, setPreferredServices] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cleaner/availability/preferences');
      const data = await response.json();
      if (data.ok) {
        const prefs = data.preferences;
        setPreferences(prefs);
        
        // Initialize form state
        if (prefs) {
          setPreferredStartTime(prefs.preferred_start_time?.slice(0, 5) || '08:00');
          setPreferredEndTime(prefs.preferred_end_time?.slice(0, 5) || '17:00');
          setPreferredDays(prefs.preferred_days_of_week || []);
          setBlockedDates(prefs.blocked_dates || []);
          setAutoDeclineOutside(prefs.auto_decline_outside_availability || false);
          setAutoDeclineMinValue(prefs.auto_decline_below_min_value || false);
          setMinBookingValue(prefs.min_booking_value_cents ? (prefs.min_booking_value_cents / 100).toString() : '');
          setPreferredServices(prefs.preferred_service_types || []);
          setMaxDistance(prefs.max_distance_km?.toString() || '');
        }
      } else {
        setError(data.error || 'Failed to load preferences');
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('An error occurred while loading preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/cleaner/availability/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_start_time: preferredStartTime ? `${preferredStartTime}:00` : null,
          preferred_end_time: preferredEndTime ? `${preferredEndTime}:00` : null,
          preferred_days_of_week: preferredDays,
          blocked_dates: blockedDates,
          blocked_time_slots: [], // TODO: Add UI for time slots
          auto_decline_outside_availability: autoDeclineOutside,
          auto_decline_below_min_value: autoDeclineMinValue,
          min_booking_value_cents: minBookingValue ? Math.round(parseFloat(minBookingValue) * 100) : null,
          preferred_service_types: preferredServices,
          max_distance_km: maxDistance ? parseInt(maxDistance, 10) : null,
          auto_accept_rules: {},
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setSuccess(true);
        setPreferences(data.preferences);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('An error occurred while saving preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== date));
  };

  const toggleService = (service: string) => {
    setPreferredServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Availability</h1>
            <div className="w-6" />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/cleaner/dashboard/profile" className="p-1">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold">Availability</h1>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
              Preferences saved successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preferred Time Slots */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3b82f6]" />
                Preferred Time Slots
              </CardTitle>
              <CardDescription>Set your preferred working hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={preferredStartTime}
                    onChange={(e) => setPreferredStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={preferredEndTime}
                    onChange={(e) => setPreferredEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Preferred Days</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${preferredDays.includes(day.value)
                          ? 'bg-[#3b82f6] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocked Dates */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3b82f6]" />
                Blocked Dates
              </CardTitle>
              <CardDescription>Block specific dates when you're unavailable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addBlockedDate} size="sm">
                  Add
                </Button>
              </div>
              {blockedDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((date) => (
                    <Badge
                      key={date}
                      variant="outline"
                      className="bg-red-50 text-red-800 border-red-200 flex items-center gap-1"
                    >
                      {(() => {
                        try {
                          const d = new Date(date);
                          if (isNaN(d.getTime())) return date;
                          
                          // Safe locale formatting with fallback
                          try {
                            const result = d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
                            if (result && result.trim().length > 0) return result;
                          } catch {}
                          
                          try {
                            const result = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            if (result && result.trim().length > 0) return result;
                          } catch {}
                          
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ||
                                 `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
                        } catch {
                          return date;
                        }
                      })()}
                      <button
                        type="button"
                        onClick={() => removeBlockedDate(date)}
                        className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        aria-label="Remove blocked date"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Decline Settings */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#3b82f6]" />
                Auto-Decline Settings
              </CardTitle>
              <CardDescription>Automatically decline bookings that don't match your preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auto-decline-outside">Decline outside availability</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Auto-decline bookings outside your preferred time slots
                  </p>
                </div>
                <Switch
                  id="auto-decline-outside"
                  checked={autoDeclineOutside}
                  onCheckedChange={setAutoDeclineOutside}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auto-decline-min-value">Decline below minimum value</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Auto-decline bookings below minimum value
                  </p>
                </div>
                <Switch
                  id="auto-decline-min-value"
                  checked={autoDeclineMinValue}
                  onCheckedChange={setAutoDeclineMinValue}
                />
              </div>

              {autoDeclineMinValue && (
                <div>
                  <Label htmlFor="min-booking-value">Minimum Booking Value (R)</Label>
                  <Input
                    id="min-booking-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minBookingValue}
                    onChange={(e) => setMinBookingValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Preferences */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-[#3b82f6]" />
                Booking Preferences
              </CardTitle>
              <CardDescription>Set your booking preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred Service Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SERVICE_TYPES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${preferredServices.includes(service)
                          ? 'bg-[#3b82f6] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="max-distance">Maximum Distance (km)</Label>
                <Input
                  id="max-distance"
                  type="number"
                  min="0"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  placeholder="No limit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum distance you're willing to travel for bookings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="sticky bottom-20 bg-white pt-4 pb-2 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

