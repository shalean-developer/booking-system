'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  created_at: string;
}

export function CleanersSection() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState<Cleaner | null>(null);
  const [deletingCleaner, setDeletingCleaner] = useState<Cleaner | null>(null);
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
    is_active: true,
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
      is_active: true,
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
      is_active: cleaner.is_active,
    });
    setEditingCleaner(cleaner);
  };

  const handleSave = async () => {
    try {
      const cleanerData = {
        ...formData,
        areas: formData.areas.split(',').map(a => a.trim()).filter(Boolean),
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        years_experience: parseInt(formData.years_experience.toString()),
      };

      const isEdit = !!editingCleaner;
      const response = await fetch('/api/admin/cleaners', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for server-side auth
        body: JSON.stringify(isEdit ? { ...cleanerData, id: editingCleaner.id } : cleanerData),
      });

      const data = await response.json();

      console.log('Save cleaner response:', data);

      if (!data.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} cleaner`);
      }

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
                    <TableHead>Areas</TableHead>
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
                      <TableCell>{cleaner.years_experience} years</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cleaner.areas?.slice(0, 2).join(', ')}
                          {cleaner.areas?.length > 2 && ` +${cleaner.areas.length - 2}`}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCleaner(cleaner)}
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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
    </div>
  );
}

