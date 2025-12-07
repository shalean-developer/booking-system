'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { devLog } from '@/lib/dev-logger';

interface ReminderPreferences {
  id: string | null;
  customer_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  email_24h: boolean;
  email_2h: boolean;
  sms_24h: boolean;
  sms_2h: boolean;
  phone_number: string | null;
}

export function ReminderSettings() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to manage reminder settings');
        return;
      }

      const response = await fetch('/api/dashboard/reminders', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setPreferences(data.preferences);
        setPhoneNumber(data.preferences.phone_number || '');
      } else {
        toast.error(data.error || 'Failed to load reminder settings');
      }
    } catch (error) {
      devLog.error('Error fetching reminder preferences:', error);
      toast.error('Failed to load reminder settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to save settings');
        return;
      }

      // Validate phone number if SMS is enabled
      if (preferences.sms_enabled && (preferences.sms_24h || preferences.sms_2h)) {
        if (!phoneNumber || phoneNumber.trim() === '') {
          toast.error('Phone number is required when SMS reminders are enabled');
          return;
        }
      }

      const response = await fetch('/api/dashboard/reminders', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          phone_number: phoneNumber.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setPreferences(data.preferences);
        toast.success('Reminder settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      devLog.error('Error saving reminder preferences:', error);
      toast.error('Failed to save reminder settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof ReminderPreferences, value: boolean | string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            Booking Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to load reminder settings</p>
          <Button onClick={fetchPreferences} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-600" />
          Booking Reminders
        </CardTitle>
        <CardDescription>
          Get notified before your appointments. Choose how you'd like to be reminded.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600" />
              <Label htmlFor="email-enabled" className="text-base font-semibold">
                Email Reminders
              </Label>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>

          {preferences.email_enabled && (
            <div className="ml-7 space-y-3 pl-4 border-l-2 border-teal-100">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-24h" className="text-sm">
                  24 hours before
                </Label>
                <Switch
                  id="email-24h"
                  checked={preferences.email_24h}
                  onCheckedChange={(checked) => updatePreference('email_24h', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-2h" className="text-sm">
                  2 hours before
                </Label>
                <Switch
                  id="email-2h"
                  checked={preferences.email_2h}
                  onCheckedChange={(checked) => updatePreference('email_2h', checked)}
                />
              </div>
            </div>
          )}
        </div>

        {/* SMS Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-600" />
              <Label htmlFor="sms-enabled" className="text-base font-semibold">
                SMS Reminders
              </Label>
            </div>
            <Switch
              id="sms-enabled"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
            />
          </div>

          {preferences.sms_enabled && (
            <div className="ml-7 space-y-3 pl-4 border-l-2 border-teal-100">
              <div className="space-y-2">
                <Label htmlFor="phone-number" className="text-sm">
                  Phone Number
                </Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+27 12 345 6789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500">
                  Required for SMS reminders. Include country code.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-24h" className="text-sm">
                  24 hours before
                </Label>
                <Switch
                  id="sms-24h"
                  checked={preferences.sms_24h}
                  onCheckedChange={(checked) => updatePreference('sms_24h', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-2h" className="text-sm">
                  2 hours before
                </Label>
                <Switch
                  id="sms-2h"
                  checked={preferences.sms_2h}
                  onCheckedChange={(checked) => updatePreference('sms_2h', checked)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
