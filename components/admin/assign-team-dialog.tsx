'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Cleaner, TeamName, TeamAssignmentData } from '@/types/booking';

interface AssignTeamDialogProps {
  booking: {
    id: string;
    service_type: string;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    address_line1: string;
    address_city: string;
    total_amount: number;
    requires_team?: boolean;
  };
  selectedTeam: TeamName;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignTeamDialog({ 
  booking, 
  selectedTeam, 
  open, 
  onClose, 
  onAssigned 
}: AssignTeamDialogProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleaners, setSelectedCleaners] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamBookingsOnDate, setTeamBookingsOnDate] = useState<number>(0);

  // Fixed earnings per cleaner for team bookings
  const EARNINGS_PER_CLEANER = 25000; // R250 in cents

  useEffect(() => {
    if (open && booking) {
      fetchCleaners();
      fetchTeamBookingsOnDate();
    }
  }, [open, booking]);

  // Don't render if booking is null - must be after hooks
  if (!booking) {
    return null;
  }

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cleaners', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch cleaners');
      }

      // Filter only active cleaners
      const activeCleaners = data.cleaners.filter((cleaner: Cleaner) => cleaner.is_active);
      setCleaners(activeCleaners);
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setError('Failed to load cleaners');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamBookingsOnDate = async () => {
    try {
      const response = await fetch(
        `/api/admin/bookings/team-availability?teamName=${encodeURIComponent(selectedTeam)}&date=${booking.booking_date}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.ok) {
        setTeamBookingsOnDate(data.bookingCount || 0);
      }
    } catch (err) {
      console.error('Error fetching team bookings:', err);
      // Don't set error, just log it
    }
  };

  const handleCleanerToggle = (cleanerId: string) => {
    setSelectedCleaners(prev => {
      const newSelection = prev.includes(cleanerId)
        ? prev.filter(id => id !== cleanerId)
        : [...prev, cleanerId];
      
      // If supervisor was deselected, clear supervisor selection
      if (supervisorId === cleanerId && !newSelection.includes(cleanerId)) {
        setSupervisorId('');
      }
      
      return newSelection;
    });
  };

  const handleSupervisorChange = (cleanerId: string) => {
    setSupervisorId(cleanerId);
  };

  const handleAssignTeam = async () => {
    if (selectedCleaners.length === 0) {
      setError('Please select at least one cleaner');
      return;
    }

    if (!supervisorId) {
      setError('Please select a supervisor');
      return;
    }

    if (!selectedCleaners.includes(supervisorId)) {
      setError('Supervisor must be selected as a team member');
      return;
    }

    try {
      setIsAssigning(true);
      setError(null);

      const assignmentData: TeamAssignmentData = {
        bookingId: booking.id,
        teamName: selectedTeam,
        supervisorId,
        cleanerIds: selectedCleaners,
      };

      const response = await fetch('/api/admin/bookings/assign-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(assignmentData),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to assign team');
      }

      console.log('Team assigned successfully:', data);
      onAssigned();
      onClose();
    } catch (err) {
      console.error('Error assigning team:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign team');
    } finally {
      setIsAssigning(false);
    }
  };

  const totalEarnings = selectedCleaners.length * EARNINGS_PER_CLEANER;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Team to Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Service:</span> {booking.service_type}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {booking.booking_date}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {booking.booking_time}
                </div>
                <div>
                  <span className="font-medium">Customer:</span> {booking.customer_name}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Address:</span> {booking.address_line1}, {booking.address_city}
                </div>
              </div>
              <div className="pt-2 border-t">
                <Badge variant="outline" className="text-primary">
                  {selectedTeam}
                </Badge>
              </div>
              {teamBookingsOnDate > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 mt-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">
                    {selectedTeam} already has {teamBookingsOnDate} booking{teamBookingsOnDate > 1 ? 's' : ''} on {booking.booking_date}. You can still assign this team.
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Cleaner Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Select Team Members</Label>
              <Badge variant="secondary">
                {selectedCleaners.length} selected
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Loading cleaners...</span>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {cleaners.map((cleaner) => (
                  <motion.div
                    key={cleaner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 border rounded-lg transition-all duration-200",
                      selectedCleaners.includes(cleaner.id)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedCleaners.includes(cleaner.id)}
                        onCheckedChange={() => handleCleanerToggle(cleaner.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">
                            {cleaner.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">
                              ⭐ {cleaner.rating}
                            </span>
                          </div>
                        </div>
                        {cleaner.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {cleaner.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            R250 earnings
                          </Badge>
                          {cleaner.specialties && cleaner.specialties.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {cleaner.specialties[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Supervisor Selection */}
          {selectedCleaners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Label className="text-lg font-semibold">Select Supervisor</Label>
              <Select value={supervisorId} onValueChange={handleSupervisorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supervisor from selected team members" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCleaners.map((cleanerId) => {
                    const cleaner = cleaners.find(c => c.id === cleanerId);
                    return cleaner ? (
                      <SelectItem key={cleanerId} value={cleanerId}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          {cleaner.name}
                        </div>
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Earnings Summary */}
          {selectedCleaners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 p-4 rounded-lg"
            >
              <h4 className="font-semibold text-gray-900 mb-2">Earnings Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Team members:</span>
                  <span>{selectedCleaners.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Earnings per cleaner:</span>
                  <span>R250</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total team earnings:</span>
                  <span>R{(totalEarnings / 100).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeam}
              disabled={isAssigning || selectedCleaners.length === 0 || !supervisorId}
              className="bg-primary hover:bg-primary/90"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning Team...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Assign Team
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
