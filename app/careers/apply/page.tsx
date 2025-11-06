'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/header";
import { Home, Send, CheckCircle, Briefcase, FileText, Clock, MapPin, Languages, Car } from "lucide-react";

function ApplyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionFromUrl = searchParams.get('position');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: positionFromUrl || '',
    location: '',
    locationDetails: '',
    coverLetter: '',
    workExperience: '',
    certifications: '',
    references: '',
    transportationDetails: 'public-transport',
    criminalBackgroundConsent: false,
  });

  const [availability, setAvailability] = useState({
    weekdays: false,
    weekends: false,
    fullTime: false,
    partTime: false,
  });

  const [languages, setLanguages] = useState({
    english: false,
    afrikaans: false,
    zulu: false,
    xhosa: false,
    other: false,
  });

  const [otherLanguage, setOtherLanguage] = useState('');

  useEffect(() => {
    if (positionFromUrl) {
      setFormData(prev => ({ ...prev, position: positionFromUrl }));
    }
  }, [positionFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (key: string) => {
    setAvailability(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleLanguageChange = (key: string) => {
    setLanguages(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
          !formData.position || !formData.location || !formData.locationDetails || !formData.coverLetter || !formData.criminalBackgroundConsent) {
        setSubmitError('Please fill in all required fields and provide consent for background check.');
        setIsSubmitting(false);
        return;
      }

      // Format availability
      const availabilityArray = Object.entries(availability)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      const availabilityString = availabilityArray.join(', ');

      // Format languages
      const languagesArray = Object.entries(languages)
        .filter(([_, value]) => value)
        .map(([key]) => {
          if (key === 'other' && otherLanguage) {
            return `Other: ${otherLanguage}`;
          }
          return key.charAt(0).toUpperCase() + key.slice(1);
        });
      const languagesString = languagesArray.join(', ');

      // Format location
      const locationString = formData.location === 'Other' 
        ? formData.locationDetails 
        : formData.locationDetails 
          ? `${formData.location}, ${formData.locationDetails}`
          : formData.location;

      // Prepare submission data
      const submissionData = {
        ...formData,
        location: locationString,
        availability: availabilityString,
        languagesSpoken: languagesString,
      };

      console.log('Submitting application:', submissionData);

      // Submit to API
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      console.log('Application submitted successfully:', result);
      setSubmitSuccess(true);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <div className="py-20 bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Application Submitted Successfully!
                </h1>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-lg text-gray-700 mb-2">
                    Thank you for applying to <strong>Shalean Cleaning Services</strong>!
                  </p>
                  <p className="text-gray-600">
                    We have received your application for the position of <strong>{formData.position}</strong>.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">What Happens Next?</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span>You will receive a confirmation email at <strong>{formData.email}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>Our HR team will review your application within 1-3 business days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span>If you match our requirements, we'll contact you for an initial screening</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span>Qualified candidates will be invited for an interview</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Back to Home
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/careers">
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Careers Page
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Join Our Team</Badge>
            <h1 className="mb-4 text-4xl sm:text-5xl font-bold text-gray-900">
              Apply to <span className="text-primary">Work With Us</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fill out the application form below to join the Shalean Cleaning Services team. 
              We're excited to learn more about you!
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required 
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required 
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required 
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <Input 
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required 
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label htmlFor="location">Location/City <span className="text-red-500">*</span></Label>
                      <select
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select your location</option>
                        <option value="Cape Town">Cape Town</option>
                        <option value="Johannesburg">Johannesburg</option>
                        <option value="Pretoria">Pretoria</option>
                        <option value="Durban">Durban</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="locationDetails">
                        Suburb/Area <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="locationDetails"
                        name="locationDetails"
                        value={formData.locationDetails}
                        onChange={handleInputChange}
                        required
                        placeholder={formData.location === 'Other' ? 'Please specify your city/location' : 'e.g., Sea Point, Sandton, etc.'}
                      />
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Position Details</h2>
                  </div>
                  
                  <div>
                    <Label htmlFor="position">Position Applying For <span className="text-red-500">*</span></Label>
                    <select
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select a position</option>
                      <option value="Residential Cleaner">Residential Cleaner</option>
                      <option value="Commercial Cleaner">Commercial Cleaner</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Airbnb Cleaner">Airbnb Cleaner</option>
                      <option value="Deep Cleaning Specialist">Deep Cleaning Specialist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">About You</h2>
                  </div>
                  
                  <div>
                    <Label htmlFor="coverLetter">Why do you want to join Shalean? <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="coverLetter"
                      name="coverLetter"
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      rows={6}
                      required 
                      placeholder="Tell us about your motivation, interests, and why you'd be a great fit for our team..."
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="workExperience">Work Experience</Label>
                    <Textarea 
                      id="workExperience"
                      name="workExperience"
                      value={formData.workExperience}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe your previous work experience, especially in cleaning or hospitality..."
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="certifications">Certifications & Training</Label>
                    <Input 
                      id="certifications"
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      placeholder="List any relevant certifications or training you have completed"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
                    {[
                      { key: 'weekdays', label: 'Weekdays (Monday - Friday)' },
                      { key: 'weekends', label: 'Weekends (Saturday - Sunday)' },
                      { key: 'fullTime', label: 'Full-time (40+ hours per week)' },
                      { key: 'partTime', label: 'Part-time (Less than 40 hours per week)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={availability[key as keyof typeof availability]}
                          onCheckedChange={() => handleAvailabilityChange(key)}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Languages className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Languages</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Which languages do you speak?</p>
                    {[
                      { key: 'english', label: 'English' },
                      { key: 'afrikaans', label: 'Afrikaans' },
                      { key: 'zulu', label: 'Zulu' },
                      { key: 'xhosa', label: 'Xhosa' },
                      { key: 'other', label: 'Other' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${key}`}
                          checked={languages[key as keyof typeof languages]}
                          onCheckedChange={() => handleLanguageChange(key)}
                        />
                        <label
                          htmlFor={`lang-${key}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                    
                    {languages.other && (
                      <Input 
                        placeholder="Please specify other language(s)"
                        value={otherLanguage}
                        onChange={(e) => setOtherLanguage(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Transportation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Transportation</h2>
                  </div>
                  
                  <div>
                    <Label htmlFor="transportationDetails">How will you commute to work?</Label>
                    <select
                      id="transportationDetails"
                      name="transportationDetails"
                      value={formData.transportationDetails}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                    >
                      <option value="own-vehicle">Own Vehicle</option>
                      <option value="public-transport">Public Transport</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="need-assistance">Need Assistance</option>
                    </select>
                  </div>
                </div>

                {/* References */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">References</h2>
                  </div>
                  
                  <div>
                    <Label htmlFor="references">Professional References</Label>
                    <Textarea 
                      id="references"
                      name="references"
                      value={formData.references}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Provide 2-3 professional references with names, phone numbers, and relationship..."
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">Optional: Include name, phone, email, and relationship</p>
                  </div>
                </div>

                {/* Consent */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="criminalBackgroundConsent"
                      checked={formData.criminalBackgroundConsent}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, criminalBackgroundConsent: checked as boolean }))
                      }
                      required
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="criminalBackgroundConsent"
                        className="text-sm font-medium leading-snug cursor-pointer"
                      >
                        I consent to a criminal background check <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        By checking this box, you authorize Shalean Cleaning Services to conduct a criminal background 
                        check as part of the application process. This is required for all positions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    disabled={isSubmitting || !formData.criminalBackgroundConsent}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Submit Application
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-sm text-gray-500 mt-4">
                    By submitting this application, you agree to our terms and privacy policy.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <ApplyFormContent />
    </Suspense>
  );
}

