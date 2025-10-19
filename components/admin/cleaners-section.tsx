'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, Check, X, Key, Shield, AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { getExperienceLevel, getCommissionRatePercentage } from '@/lib/cleaner-earnings';
import { DayScheduleEditor } from '@/components/admin/day-schedule-editor';
import { DayAvailabilityDisplay } from '@/components/admin/day-availability-display';

interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo_url: string;
  rating: number;
  bio: string;
  years_experience: number;
  areas: string[];
  specialties: string[];
  is_active: boolean;
  hire_date: string;
  created_at: string;
  auth_provider?: string;
  password_hash?: string;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

export function CleanersSection() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState<Cleaner | null>(null);
  const [deletingCleaner, setDeletingCleaner] = useState<Cleaner | null>(null);
  const [passwordDialogCleaner, setPasswordDialogCleaner] = useState<Cleaner | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo_url: '',
    bio: '',
    years_experience: 0,
    areas: '',
    specialties: '',
    hire_date: '',
    is_active: true,
    password: '',
    auth_provider: 'both',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
    auth_provider: 'both',
  });

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        includeInactive: includeInactive.toString(),
      });

      const response = await fetch(`/api/admin/cleaners?${params}`, {
        credentials: 'include', // Include cookies for server-side auth
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch cleaners');
      }

      setCleaners(data.cleaners);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, [includeInactive]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      photo_url: '',
      bio: '',
      years_experience: 0,
      areas: '',
      specialties: '',
      hire_date: '',
      is_active: true,
      password: '',
      auth_provider: 'both',
    });
  };

  const resetPasswordForm = () => {
    setPasswordData({
      password: '',
      confirmPassword: '',
      auth_provider: 'both',
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEdit = (cleaner: Cleaner) => {
    setFormData({
      name: cleaner.name,
      email: cleaner.email || '',
      phone: cleaner.phone || '',
      photo_url: cleaner.photo_url || '',
      bio: cleaner.bio || '',
      years_experience: cleaner.years_experience || 0,
      areas: cleaner.areas?.join(', ') || '',
      specialties: cleaner.specialties?.join(', ') || '',
      hire_date: cleaner.hire_date || '',
      is_active: cleaner.is_active,
      password: '',
      auth_provider: cleaner.auth_provider || 'both',
    });
    setEditingCleaner(cleaner);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.phone) {
        alert('Name and phone number are required');
        return;
      }

      const isEdit = !!editingCleaner;

      // Prepare cleaner data (excluding password - it's handled separately)
      const cleanerData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        photo_url: formData.photo_url,
        bio: formData.bio,
        years_experience: parseInt(formData.years_experience.toString()) || 0,
        areas: formData.areas.split(',').map(a => a.trim()).filter(Boolean),
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        is_active: formData.is_active,
      };

      // Only include hire_date and auth_provider if they exist in the database
      // These require migrations to be run first
      if (formData.hire_date) {
        cleanerData.hire_date = formData.hire_date;
      }
      if (formData.auth_provider) {
        cleanerData.auth_provider = formData.auth_provider;
      }

      console.log('Sending cleaner data:', cleanerData);

      // Create/update cleaner first
      const response = await fetch('/api/admin/cleaners', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isEdit ? { ...cleanerData, id: editingCleaner.id } : cleanerData),
      });

      // Log response status for debugging
      console.log('Response status:', response.status, response.statusText);

      // Check if response is OK before parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create cleaner'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.ok) {
        console.error('Cleaner API error:', data);
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} cleaner`);
      }

      // If password is provided, set it via the password API
      if (formData.password) {
        const passwordResponse = await fetch('/api/admin/cleaners/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: data.cleaner.id,
            password: formData.password,
            auth_provider: formData.auth_provider,
          }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordData.ok) {
          console.error('Password API error:', passwordData);
          throw new Error(passwordData.error || 'Failed to set password');
        }
      }

      alert(`Cleaner ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowAddDialog(false);
      setEditingCleaner(null);
      resetForm();
      fetchCleaners();
    } catch (err) {
      console.error('Error saving cleaner:', err);
      const errorMsg = err instanceof Error ? err.message : `Failed to ${editingCleaner ? 'update' : 'create'} cleaner`;
      alert(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!deletingCleaner) return;

    try {
      const response = await fetch(`/api/admin/cleaners?id=${deletingCleaner.id}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for server-side auth
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete cleaner');
      }

      setDeletingCleaner(null);
      fetchCleaners();
    } catch (err) {
      console.error('Error deleting cleaner:', err);
      alert('Failed to delete cleaner');
    }
  };

  const handleSetPassword = async () => {
    if (!passwordDialogCleaner) return;

    // Validate passwords match
    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/api/admin/cleaners/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: passwordDialogCleaner.id,
          password: passwordData.password,
          auth_provider: passwordData.auth_provider,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      alert('Password updated successfully');
      setPasswordDialogCleaner(null);
      resetPasswordForm();
      fetchCleaners();
    } catch (err) {
      console.error('Error setting password:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to set password';
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cleaners Management</CardTitle>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Cleaner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="flex items-center gap-2 mb-6">
            <Checkbox
              id="includeInactive"
              checked={includeInactive}
              onCheckedChange={(checked) => setIncludeInactive(!!checked)}
            />
            <Label htmlFor="includeInactive">Show inactive cleaners</Label>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cleaners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No cleaners found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Weekly Schedule</TableHead>
                    <TableHead>Areas</TableHead>
                    <TableHead>Auth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaners.map((cleaner) => (
                    <TableRow key={cleaner.id}>
                      <TableCell>
                        <div className="font-medium">{cleaner.name}</div>
                        <div className="text-sm text-gray-500">Rating: {cleaner.rating}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{cleaner.email}</div>
                        <div className="text-sm text-gray-500">{cleaner.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{cleaner.years_experience} years</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={getExperienceLevel(cleaner.hire_date) === 'experienced' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {getExperienceLevel(cleaner.hire_date) === 'experienced' ? 'Experienced' : 'New'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getCommissionRatePercentage(cleaner.hire_date)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DayAvailabilityDisplay 
                          schedule={cleaner} 
                          compact={true}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cleaner.areas?.slice(0, 2).join(', ')}
                          {cleaner.areas?.length > 2 && ` +${cleaner.areas.length - 2}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline"
                            className={
                              cleaner.auth_provider === 'password' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : cleaner.auth_provider === 'otp'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }
                          >
                            {cleaner.auth_provider === 'password' ? 'Password' : 
                             cleaner.auth_provider === 'otp' ? 'OTP' : 'Both'}
                          </Badge>
                          {cleaner.password_hash && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Has password
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cleaner.is_active 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'}>
                          {cleaner.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cleaner)}
                            title="Edit cleaner"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPasswordDialogCleaner(cleaner);
                              setPasswordData({
                                password: '',
                                confirmPassword: '',
                                auth_provider: cleaner.auth_provider || 'both',
                              });
                            }}
                            title="Set password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCleaner(cleaner)}
                            title="Delete cleaner"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showAddDialog || !!editingCleaner} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingCleaner(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCleaner ? 'Edit Cleaner' : 'Add New Cleaner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27123456789 or 0123456789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be normalized to +27 format
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password {!editingCleaner && '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingCleaner ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingCleaner ? 'Leave empty to keep current password' : 'Minimum 6 characters'}
                </p>
              </div>
              <div>
                <Label htmlFor="auth_provider">Login Method *</Label>
                <select
                  id="auth_provider"
                  value={formData.auth_provider}
                  onChange={(e) => setFormData({ ...formData, auth_provider: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="both">Password & OTP</option>
                  <option value="password">Password Only</option>
                  <option value="otp">OTP Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How cleaner can log in
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used to calculate commission rate (60% for &lt;4 months, 70% for 4+ months)
              </p>
            </div>
            <div>
              <Label htmlFor="areas">Areas (comma-separated)</Label>
              <Input
                id="areas"
                value={formData.areas}
                onChange={(e) => setFormData({ ...formData, areas: e.target.value })}
                placeholder="e.g., Sandton, Rosebank, Midrand"
              />
            </div>
            <div>
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="e.g., Deep cleaning, Move-in/out"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            {/* Day Schedule Editor - Only show when editing existing cleaner */}
            {editingCleaner && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Weekly Schedule</h3>
                <DayScheduleEditor 
                  cleaner={editingCleaner}
                  onUpdate={fetchCleaners}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                setEditingCleaner(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingCleaner ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCleaner} onOpenChange={(open) => !open && setDeletingCleaner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cleaner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingCleaner?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCleaner(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog 
        open={!!passwordDialogCleaner} 
        onOpenChange={(open) => {
          if (!open) {
            setPasswordDialogCleaner(null);
            resetPasswordForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Set Login Credentials
            </DialogTitle>
            <DialogDescription>
              Update password and authentication method for {passwordDialogCleaner?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Phone Number</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm font-mono">
                {passwordDialogCleaner?.phone || 'Not set'}
              </div>
            </div>
            <div>
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
              />
            </div>
            <div>
              <Label htmlFor="pwd-auth-provider">Login Method *</Label>
              <select
                id="pwd-auth-provider"
                value={passwordData.auth_provider}
                onChange={(e) => setPasswordData({ ...passwordData, auth_provider: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="both">Password & OTP</option>
                <option value="password">Password Only</option>
                <option value="otp">OTP Only</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose how this cleaner can authenticate
              </p>
            </div>
            {passwordData.password && passwordData.password.length < 6 && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Password must be at least 6 characters
              </div>
            )}
            {passwordData.password && passwordData.confirmPassword && 
             passwordData.password !== passwordData.confirmPassword && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords do not match
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPasswordDialogCleaner(null);
                resetPasswordForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSetPassword}
              disabled={
                !passwordData.password || 
                !passwordData.confirmPassword || 
                passwordData.password !== passwordData.confirmPassword ||
                passwordData.password.length < 6
              }
            >
              Update Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

