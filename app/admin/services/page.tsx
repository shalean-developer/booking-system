'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Service {
  service_type: string;
  base_price: number;
  bedroom_rate: number;
  bathroom_rate: number;
  description?: string;
}

const SERVICE_TYPES = ['Standard', 'Deep', 'Airbnb', 'Move In/Out', 'Carpet'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Service>({
    service_type: '',
    base_price: 0,
    bedroom_rate: 0,
    bathroom_rate: 0,
    description: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing');
      const data = await response.json();

      if (data.ok && data.current) {
        // Extract service pricing from pricing config
        const serviceMap = new Map<string, Service>();
        
        // Group pricing by service type
        Object.values(data.current.services || {}).forEach((service: any) => {
          const serviceType = service.service_type;
          if (!serviceMap.has(serviceType)) {
            serviceMap.set(serviceType, {
              service_type: serviceType,
              base_price: 0,
              bedroom_rate: 0,
              bathroom_rate: 0,
              description: '',
            });
          }
          
          const s = serviceMap.get(serviceType)!;
          if (service.price_type === 'base') {
            s.base_price = service.price;
          } else if (service.price_type === 'bedroom') {
            s.bedroom_rate = service.price;
          } else if (service.price_type === 'bathroom') {
            s.bathroom_rate = service.price;
          }
        });

        // Add service types that don't have pricing yet
        SERVICE_TYPES.forEach((type) => {
          if (!serviceMap.has(type)) {
            serviceMap.set(type, {
              service_type: type,
              base_price: 0,
              bedroom_rate: 0,
              bathroom_rate: 0,
              description: '',
            });
          }
        });

        setServices(Array.from(serviceMap.values()));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({ ...service });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      // Save base price
      if (formData.base_price > 0) {
        await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_type: formData.service_type,
            price_type: 'base',
            price: formData.base_price,
          }),
        });
      }

      // Save bedroom rate
      if (formData.bedroom_rate > 0) {
        await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_type: formData.service_type,
            price_type: 'bedroom',
            price: formData.bedroom_rate,
          }),
        });
      }

      // Save bathroom rate
      if (formData.bathroom_rate > 0) {
        await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_type: formData.service_type,
            price_type: 'bathroom',
            price: formData.bathroom_rate,
          }),
        });
      }

      setShowDialog(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage cleaning service types and pricing</p>
        </div>
        <Button onClick={() => {
          setFormData({
            service_type: '',
            base_price: 0,
            bedroom_rate: 0,
            bathroom_rate: 0,
            description: '',
          });
          setEditingService(null);
          setShowDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Per Bedroom</TableHead>
                  <TableHead>Per Bathroom</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No services found
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.service_type}>
                      <TableCell className="font-medium">{service.service_type}</TableCell>
                      <TableCell>{formatCurrency(service.base_price)}</TableCell>
                      <TableCell>{formatCurrency(service.bedroom_rate)}</TableCell>
                      <TableCell>{formatCurrency(service.bathroom_rate)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Create Service'}
            </DialogTitle>
            <DialogDescription>
              Configure service pricing and details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service_type">Service Type</Label>
              <select
                id="service_type"
                value={formData.service_type}
                onChange={(e) =>
                  setFormData({ ...formData, service_type: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                disabled={!!editingService}
              >
                <option value="">Select service type</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="base_price">Base Price (R)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="bedroom_rate">Per Bedroom (R)</Label>
                <Input
                  id="bedroom_rate"
                  type="number"
                  value={formData.bedroom_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bedroom_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="bathroom_rate">Per Bathroom (R)</Label>
                <Input
                  id="bathroom_rate"
                  type="number"
                  value={formData.bathroom_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bathroom_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Service description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

