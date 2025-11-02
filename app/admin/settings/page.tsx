'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

interface CompanySettings {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  postal_code: string;
  business_hours: BusinessHours[];
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'Shalean Cleaning Services',
    contact_email: 'info@shalean.com',
    contact_phone: '+27 21 123 4567',
    address: '',
    city: 'Cape Town',
    postal_code: '',
    business_hours: DAYS_OF_WEEK.map((day) => ({
      day,
      open: '08:00',
      close: '17:00',
      isOpen: day !== 'Sunday',
    })),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: any) => {
    const updated = [...settings.business_hours];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, business_hours: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage company information and business settings</p>
      </div>

      {/* Company Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Update your company details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={settings.postal_code}
                onChange={(e) =>
                  setSettings({ ...settings, postal_code: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>
              Set your operating hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.business_hours.map((hours, index) => (
              <div
                key={hours.day}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-24">
                  <Label>{hours.day}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hours.isOpen}
                    onCheckedChange={(checked) =>
                      updateBusinessHours(index, 'isOpen', checked)
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {hours.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                {hours.isOpen && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`open-${index}`} className="text-sm">
                        Open:
                      </Label>
                      <Input
                        id={`open-${index}`}
                        type="time"
                        value={hours.open}
                        onChange={(e) =>
                          updateBusinessHours(index, 'open', e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`close-${index}`} className="text-sm">
                        Close:
                      </Label>
                      <Input
                        id={`close-${index}`}
                        type="time"
                        value={hours.close}
                        onChange={(e) =>
                          updateBusinessHours(index, 'close', e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

