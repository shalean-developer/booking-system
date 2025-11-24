'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.ok) {
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system configuration and preferences"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings' },
        ]}
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.site_name || ''}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={settings.site_url || ''}
                  onChange={(e) => updateSetting('site_url', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.timezone || 'Africa/Johannesburg'}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Company details and contact information</CardDescription>
        </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.business_name || ''}
                  onChange={(e) => updateSetting('business_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={settings.business_email || ''}
                  onChange={(e) => updateSetting('business_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={settings.business_phone || ''}
                  onChange={(e) => updateSetting('business_phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea
                  id="businessAddress"
                  value={settings.business_address || ''}
                  onChange={(e) => updateSetting('business_address', e.target.value)}
                />
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email templates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.from_email || ''}
                  onChange={(e) => updateSetting('from_email', e.target.value)}
                />
            </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={settings.from_name || ''}
                  onChange={(e) => updateSetting('from_name', e.target.value)}
                />
            </div>
              <div className="space-y-2">
                <Label htmlFor="bookingConfirmation">Booking Confirmation Template</Label>
                <Textarea
                  id="bookingConfirmation"
                  rows={5}
                  value={settings.booking_confirmation_template || ''}
                  onChange={(e) => updateSetting('booking_confirmation_template', e.target.value)}
                />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Advanced system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenance_mode || false}
                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="maintenanceMode" className="font-normal">
                    Enable maintenance mode
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingsPerDay">Max Bookings Per Day</Label>
                <Input
                  id="maxBookingsPerDay"
                  type="number"
                  value={settings.max_bookings_per_day || ''}
                  onChange={(e) => updateSetting('max_bookings_per_day', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingAdvanceDays">Booking Advance Days</Label>
                <Input
                  id="bookingAdvanceDays"
                  type="number"
                  value={settings.booking_advance_days || ''}
                  onChange={(e) => updateSetting('booking_advance_days', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
