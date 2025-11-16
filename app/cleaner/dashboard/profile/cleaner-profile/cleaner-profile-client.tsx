'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { UserCheck, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
}

interface CleanerProfileClientProps {
  cleaner: CleanerSession;
}

interface CleanerProfile {
  bio: string;
  years_experience: number;
  specialties: string;
  areas: string;
}

export function CleanerProfileClient({ cleaner }: CleanerProfileClientProps) {
  const [profile, setProfile] = useState<CleanerProfile>({
    bio: '',
    years_experience: 0,
    specialties: '',
    areas: cleaner.areas?.join(', ') || '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current cleaner profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/cleaner/cleaner-profile');
        const data = await response.json();

        if (data.ok && data.profile) {
          setProfile({
            bio: data.profile.bio || '',
            years_experience: data.profile.years_experience || 0,
            specialties: Array.isArray(data.profile.specialties)
              ? data.profile.specialties.join(', ')
              : data.profile.specialties || '',
            areas: Array.isArray(data.profile.areas)
              ? data.profile.areas.join(', ')
              : data.profile.areas || '',
          });
        }
      } catch (error) {
        console.error('Error fetching cleaner profile:', error);
        setErrorMessage('Failed to load cleaner profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/cleaner/cleaner-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: profile.bio,
          years_experience: profile.years_experience,
          specialties: profile.specialties,
          areas: profile.areas,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage('Cleaner profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(data.error || 'Failed to update cleaner profile');
      }
    } catch (error) {
      console.error('Error updating cleaner profile:', error);
      setErrorMessage('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof CleanerProfile, value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Cleaner profile</h1>
            <UserCheck className="h-6 w-6" strokeWidth={2} />
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
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Cleaner profile</h1>
            <UserCheck className="h-6 w-6" strokeWidth={2} />
          </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Cleaner Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio Field */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                Bio / About Me
              </Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell clients about yourself and your experience..."
                rows={5}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500">
                Describe your experience, skills, and what makes you a great cleaner.
              </p>
            </div>

            {/* Years of Experience Field */}
            <div className="space-y-2">
              <Label htmlFor="years_experience" className="text-sm font-medium text-gray-700">
                Years of Experience
              </Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                value={profile.years_experience}
                onChange={(e) => handleChange('years_experience', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Number of years you've been working as a cleaner.
              </p>
            </div>

            {/* Specialties Field */}
            <div className="space-y-2">
              <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                Specialties
              </Label>
              <Input
                id="specialties"
                type="text"
                value={profile.specialties}
                onChange={(e) => handleChange('specialties', e.target.value)}
                placeholder="e.g., Deep cleaning, Move-in/out, Office cleaning"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Separate multiple specialties with commas.
              </p>
            </div>

            {/* Areas Field */}
            <div className="space-y-2">
              <Label htmlFor="areas" className="text-sm font-medium text-gray-700">
                Service Areas *
              </Label>
              <Input
                id="areas"
                type="text"
                value={profile.areas}
                onChange={(e) => handleChange('areas', e.target.value)}
                placeholder="e.g., Cape Town, Sea Point, Green Point"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Separate multiple areas with commas. These are the areas where you provide services.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}
