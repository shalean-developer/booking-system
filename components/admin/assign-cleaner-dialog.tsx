'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Crown, CheckCircle } from 'lucide-react';
import type { TeamName } from '@/types/booking';

interface Cleaner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  photo_url?: string;
}

interface AssignCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  bookingCity: string;
  serviceType?: string;
  onSuccess?: () => void;
}

export function AssignCleanerDialog({
  open,
  onOpenChange,
  bookingId,
  bookingDate,
  bookingCity,
  serviceType,
  onSuccess,
}: AssignCleanerDialogProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [selectedCleanerIds, setSelectedCleanerIds] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<TeamName | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingAllCleaners, setIsShowingAllCleaners] = useState(false);
  const [requiresTeam, setRequiresTeam] = useState(false);

  useEffect(() => {
    if (open && bookingDate) {
      // Check if service requires team
      const needsTeam = serviceType === 'Deep' || serviceType === 'Move In/Out';
      setRequiresTeam(needsTeam);
      if (needsTeam) {
        // For teams, only fetch cleaners after team is selected
        setSelectedTeamName(null);
      } else {
        // For individual cleaners, fetch immediately
        fetchCleaners();
      }
      setSelectedCleanerId('');
      setSelectedCleanerIds([]);
      setSupervisorId('');
      setError(null);
    }
  }, [open, bookingDate, bookingCity, serviceType]);

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsShowingAllCleaners(false);

      // First, try to get available cleaners (filtered by date and city)
      if (bookingDate && bookingCity) {
        const params = new URLSearchParams({
          date: bookingDate,
          city: bookingCity,
        });
        const availableResponse = await fetch(`/api/cleaners/available?${params}`, {
          credentials: 'include',
        });
        
        if (availableResponse.ok) {
          const availableData = await availableResponse.json();
          if (availableData.ok && availableData.cleaners && availableData.cleaners.length > 0) {
            setCleaners(availableData.cleaners);
            setIsLoading(false);
            return;
          }
        }
      }

      // If no available cleaners found, fall back to all active cleaners (admin override)
      const allCleanersResponse = await fetch('/api/admin/cleaners?active=true&limit=100', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!allCleanersResponse.ok) {
        throw new Error(`HTTP error! status: ${allCleanersResponse.status}`);
      }
      
      const allCleanersData = await allCleanersResponse.json();

      if (allCleanersData.ok && allCleanersData.cleaners) {
        // Transform the admin cleaners response to match the Cleaner interface
        const transformedCleaners = allCleanersData.cleaners.map((c: any) => ({
          id: c.id,
          name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
          email: c.email,
          phone: c.phone,
          rating: c.average_rating || c.rating,
          photo_url: c.photo_url,
        }));
        setCleaners(transformedCleaners);
        setIsShowingAllCleaners(true);
      } else {
        setCleaners([]);
        setError(allCleanersData.error || 'Failed to fetch cleaners');
      }
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      setError('Failed to load cleaners');
      setCleaners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (requiresTeam) {
      // Team assignment validation
      if (!selectedTeamName) {
        setError('Please select a team (Team A, B, or C)');
        return;
      }
      if (selectedCleanerIds.length === 0) {
        setError('Please select at least one cleaner for the team');
        return;
      }
      if (!supervisorId) {
        setError('Please select a supervisor for the team');
        return;
      }
      if (!selectedCleanerIds.includes(supervisorId)) {
        setError('Supervisor must be selected as a team member');
        return;
      }
    } else {
      // Single cleaner validation
      if (!selectedCleanerId) {
        setError('Please select a cleaner');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const body = requiresTeam
        ? {
            team_name: selectedTeamName,
            cleaner_ids: selectedCleanerIds,
            supervisor_id: supervisorId,
          }
        : {
            cleaner_id: selectedCleanerId,
          };

      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || 'Failed to assign cleaner/team');
        }
        throw new Error(errorData.error || 'Failed to assign cleaner/team');
      }

      const data = await response.json();

      if (data.ok) {
        onSuccess?.();
        setSelectedCleanerId('');
        setSelectedCleanerIds([]);
        setSupervisorId('');
        setSelectedTeamName(null);
        setError(null);
        onOpenChange(false);
      } else {
        setError(data.error || 'Failed to assign cleaner/team');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign cleaner/team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCleanerToggle = (cleanerId: string) => {
    if (requiresTeam) {
      setSelectedCleanerIds((prev) => {
        if (prev.includes(cleanerId)) {
          // Remove cleaner
          const newIds = prev.filter((id) => id !== cleanerId);
          // If supervisor was removed, clear supervisor
          if (supervisorId === cleanerId) {
            setSupervisorId('');
          }
          return newIds;
        } else {
          // Add cleaner
          return [...prev, cleanerId];
        }
      });
    }
  };

  const handleSupervisorSelect = (cleanerId: string) => {
    if (requiresTeam && selectedCleanerIds.includes(cleanerId)) {
      setSupervisorId(cleanerId);
    }
  };

  const handleTeamSelect = (teamName: TeamName) => {
    setSelectedTeamName(teamName);
    setSelectedCleanerIds([]);
    setSupervisorId('');
    setError(null);
    // Fetch cleaners after team is selected
    if (!cleaners.length) {
      fetchCleaners();
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when dialog closes
      setSelectedCleanerId('');
      setSelectedCleanerIds([]);
      setSupervisorId('');
      setSelectedTeamName(null);
      setError(null);
      setIsShowingAllCleaners(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{requiresTeam ? 'Assign Team' : 'Assign Cleaner'}</DialogTitle>
          <DialogDescription>
            {requiresTeam ? (
              <span>
                {selectedTeamName 
                  ? `Assign cleaners to ${selectedTeamName} for this ${serviceType} booking on ${bookingDate ? new Date(bookingDate).toLocaleDateString('en-ZA') : 'this date'}`
                  : `Select a team (Team A, B, or C) for this ${serviceType} booking on ${bookingDate ? new Date(bookingDate).toLocaleDateString('en-ZA') : 'this date'}`
                }
              </span>
            ) : isShowingAllCleaners ? (
              <span>
                No cleaners available for {bookingDate ? new Date(bookingDate).toLocaleDateString('en-ZA') : 'this date'}{bookingCity ? ` in ${bookingCity}` : ''}. 
                Showing all active cleaners (admin override).
              </span>
            ) : (
              <span>
                Select a cleaner for this booking on {bookingDate ? new Date(bookingDate).toLocaleDateString('en-ZA') : 'this date'}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {requiresTeam && !selectedTeamName ? (
          // Team selection step
          <div className="space-y-4">
            <Label>Select a Team</Label>
            <div className="grid grid-cols-3 gap-4">
              {(['Team A', 'Team B', 'Team C'] as TeamName[]).map((teamName) => (
                <button
                  key={teamName}
                  onClick={() => handleTeamSelect(teamName)}
                  className={`relative rounded-lg border-2 p-4 text-center transition-all ${
                    selectedTeamName === teamName
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{teamName}</h3>
                    {selectedTeamName === teamName && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                    <p className="text-xs text-gray-600">Professional team</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading cleaners...</span>
          </div>
        ) : cleaners.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {error ? (
              <div>
                <p className="text-red-600 mb-2">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCleaners}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              'No cleaners found. Please ensure there are active cleaners in the system.'
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Label>
              {requiresTeam
                ? 'Select Team Members'
                : isShowingAllCleaners
                ? 'All Active Cleaners'
                : 'Available Cleaners'}
            </Label>
            {isShowingAllCleaners && (
              <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ Showing all active cleaners as admin override. These cleaners may not be available for this specific date and location.
                </p>
              </div>
            )}
            {requiresTeam && selectedTeamName && (
              <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
                <p className="text-xs text-blue-800">
                  ℹ️ Assign cleaners to <strong>{selectedTeamName}</strong>. Select multiple cleaners and designate one as supervisor (marked with 👑).
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setSelectedTeamName(null)}
                >
                  Change Team
                </Button>
              </div>
            )}
            {requiresTeam && selectedTeamName ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cleaners.map((cleaner) => {
                  const isSelected = selectedCleanerIds.includes(cleaner.id);
                  const isSupervisor = supervisorId === cleaner.id;
                  return (
                    <div
                      key={cleaner.id}
                      className={`flex items-center space-x-3 rounded-lg border p-3 ${
                        isSelected ? 'bg-accent border-primary' : 'hover:bg-accent'
                      } cursor-pointer`}
                      onClick={() => handleCleanerToggle(cleaner.id)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleCleanerToggle(cleaner.id)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {cleaner.photo_url ? (
                            <img
                              src={cleaner.photo_url}
                              alt={cleaner.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium cursor-pointer">
                                {cleaner.name}
                              </Label>
                              {isSupervisor && (
                                <Badge variant="default" className="bg-yellow-600">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Supervisor
                                </Badge>
                              )}
                              {cleaner.rating && (
                                <Badge variant="outline">
                                  ⭐ {cleaner.rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            {cleaner.email && (
                              <p className="text-xs text-muted-foreground">{cleaner.email}</p>
                            )}
                            {cleaner.phone && (
                              <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
                            )}
                            {isSelected && !isSupervisor && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSupervisorSelect(cleaner.id);
                                }}
                              >
                                Set as Supervisor
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <RadioGroup value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {cleaners.map((cleaner) => (
                    <div
                      key={cleaner.id}
                      className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer"
                    >
                      <RadioGroupItem value={cleaner.id} id={cleaner.id} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {cleaner.photo_url ? (
                            <img
                              src={cleaner.photo_url}
                              alt={cleaner.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Label htmlFor={cleaner.id} className="font-medium cursor-pointer">
                              {cleaner.name}
                            </Label>
                            {cleaner.rating && (
                              <Badge variant="outline" className="ml-2">
                                ⭐ {cleaner.rating.toFixed(1)}
                              </Badge>
                            )}
                            {cleaner.email && (
                              <p className="text-xs text-muted-foreground">{cleaner.email}</p>
                            )}
                            {cleaner.phone && (
                              <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {requiresTeam && selectedCleanerIds.length > 0 && (
              <div className="rounded-md bg-green-50 p-3 border border-green-200">
                <p className="text-xs text-green-800">
                  ✓ {selectedCleanerIds.length} cleaner(s) selected
                  {supervisorId ? ' • Supervisor assigned' : ' • Select a supervisor'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              isSubmitting ||
              (requiresTeam
                ? !selectedTeamName || selectedCleanerIds.length === 0 || !supervisorId
                : !selectedCleanerId)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : requiresTeam ? (
              'Assign Team'
            ) : (
              'Assign Cleaner'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

