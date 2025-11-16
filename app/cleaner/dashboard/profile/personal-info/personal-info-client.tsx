'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { UserCircle, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface PersonalInfoClientProps {
  cleaner: CleanerSession;
}

interface PersonalInfo {
  name: string;
  phone: string;
  email: string;
  photo_url: string;
}

export function PersonalInfoClient({ cleaner }: PersonalInfoClientProps) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: cleaner.name || '',
    phone: cleaner.phone || '',
    email: '',
    photo_url: cleaner.photo_url || '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current personal info
  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        const response = await fetch('/api/cleaner/personal-info');
        const data = await response.json();

        if (data.ok && data.personal_info) {
          setPersonalInfo({
            name: data.personal_info.name || '',
            phone: data.personal_info.phone || '',
            email: data.personal_info.email || '',
            photo_url: data.personal_info.photo_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching personal info:', error);
        setErrorMessage('Failed to load personal information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/cleaner/personal-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalInfo),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage('Personal information updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(data.error || 'Failed to update personal information');
      }
    } catch (error) {
      console.error('Error updating personal info:', error);
      setErrorMessage('An error occurred while updating your information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo((prev) => ({
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
            <h1 className="text-lg font-semibold">Personal info</h1>
            <UserCircle className="h-6 w-6" strokeWidth={2} />
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
            <h1 className="text-lg font-semibold">Personal info</h1>
            <UserCircle className="h-6 w-6" strokeWidth={2} />
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

          {/* Personal Info Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={personalInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                required
                className="w-full"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={personalInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email address"
                className="w-full"
              />
            </div>

            {/* Photo URL Field */}
            <div className="space-y-2">
              <Label htmlFor="photo_url" className="text-sm font-medium text-gray-700">
                Photo URL
              </Label>
              <Input
                id="photo_url"
                type="url"
                value={personalInfo.photo_url}
                onChange={(e) => handleChange('photo_url', e.target.value)}
                placeholder="Enter photo URL"
                className="w-full"
              />
              {personalInfo.photo_url && (
                <div className="mt-2">
                  <img
                    src={personalInfo.photo_url}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
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
