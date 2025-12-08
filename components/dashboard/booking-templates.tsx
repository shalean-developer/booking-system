'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Plus, Edit2, Trash2, Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { devLog } from '@/lib/dev-logger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import type { ServiceType } from '@/types/booking';

interface BookingTemplate {
  id: string;
  customer_id: string;
  name: string;
  service_type: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extras_quantities: Record<string, number>;
  notes: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  cleaner_id: string | null;
  selected_team: string | null;
  requires_team: boolean;
  tip_amount: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function BookingTemplates() {
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BookingTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'Standard' as ServiceType,
    bedrooms: 2,
    bathrooms: 1,
    extras: [] as string[],
    extras_quantities: {} as Record<string, number>,
    notes: '',
    frequency: 'one-time' as 'one-time' | 'weekly' | 'bi-weekly' | 'monthly',
    address_line1: '',
    address_suburb: '',
    address_city: '',
    cleaner_id: null as string | null,
    selected_team: null as string | null,
    requires_team: false,
    tip_amount: 0,
    is_default: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to view booking templates');
        return;
      }

      const response = await fetch('/api/dashboard/templates', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setTemplates(data.templates || []);
      } else {
        toast.error(data.error || 'Failed to load booking templates');
      }
    } catch (error) {
      devLog.error('Error fetching booking templates:', error);
      toast.error('Failed to load booking templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (template?: BookingTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        service_type: template.service_type,
        bedrooms: template.bedrooms,
        bathrooms: template.bathrooms,
        extras: template.extras || [],
        extras_quantities: template.extras_quantities || {},
        notes: template.notes || '',
        frequency: template.frequency || 'one-time',
        address_line1: template.address_line1 || '',
        address_suburb: template.address_suburb || '',
        address_city: template.address_city || '',
        cleaner_id: template.cleaner_id,
        selected_team: template.selected_team,
        requires_team: template.requires_team || false,
        tip_amount: template.tip_amount || 0,
        is_default: template.is_default || false,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        service_type: 'Standard',
        bedrooms: 2,
        bathrooms: 1,
        extras: [],
        extras_quantities: {},
        notes: '',
        frequency: 'one-time',
        address_line1: '',
        address_suburb: '',
        address_city: '',
        cleaner_id: null,
        selected_team: null,
        requires_team: false,
        tip_amount: 0,
        is_default: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      setIsSaving(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to save templates');
        return;
      }

      const url = editingTemplate
        ? '/api/dashboard/templates'
        : '/api/dashboard/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate
          ? { id: editingTemplate.id, ...formData }
          : formData
        ),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        toast.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setIsDialogOpen(false);
        fetchTemplates();
      } else {
        toast.error(data.error || 'Failed to save template');
      }
    } catch (error) {
      devLog.error('Error saving booking template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setDeletingId(templateId);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to delete templates');
        return;
      }

      const response = await fetch(`/api/dashboard/templates?id=${encodeURIComponent(templateId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        toast.error(data.error || 'Failed to delete template');
      }
    } catch (error) {
      devLog.error('Error deleting booking template:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseTemplate = (template: BookingTemplate) => {
    // Store template data in sessionStorage for booking flow to pick up
    sessionStorage.setItem('booking_template', JSON.stringify(template));
    toast.success('Template loaded! Start a new booking to use it.');
    // Optionally redirect to booking flow
    window.location.href = '/booking/service/select';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Booking Templates
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Booking Templates
              </CardTitle>
              <CardDescription>
                Save booking configurations for quick reuse. Templates speed up your booking process.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No booking templates yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Create a template to save your booking preferences and speed up future bookings.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>{template.service_type}</span>
                      <span>•</span>
                      <span>{template.bedrooms} bed, {template.bathrooms} bath</span>
                      {template.frequency !== 'one-time' && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{template.frequency}</span>
                        </>
                      )}
                      {template.address_suburb && (
                        <>
                          <span>•</span>
                          <span>{template.address_suburb}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Save your booking preferences for quick reuse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Home Cleaning"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value as ServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deep">Deep</SelectItem>
                    <SelectItem value="Move In/Out">Move In/Out</SelectItem>
                    <SelectItem value="Airbnb">Airbnb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address_line1">Address</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_suburb">Suburb</Label>
                <Input
                  id="address_suburb"
                  value={formData.address_suburb}
                  onChange={(e) => setFormData({ ...formData, address_suburb: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special instructions or notes"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Set as default template
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingTemplate ? 'Update Template' : 'Create Template'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
