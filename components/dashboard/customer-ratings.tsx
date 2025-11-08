'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Star, 
  Loader2, 
  Calendar, 
  User, 
  MapPin
} from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  created_at: string;
  bookings: {
    booking_date: string;
    booking_time: string;
    service_type: string;
    address_line1: string;
    address_suburb: string;
    address_city: string;
  } | null;
  cleaners: {
    id: string;
    name: string;
    photo_url: string | null;
  } | null;
}

export function CustomerRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/ratings');
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch ratings');
      }

      setRatings(data.ratings || []);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ratings');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">({rating}/5)</span>
      </div>
    );
  };

  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading your ratings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 mb-2">Failed to load ratings</div>
        <p className="text-red-500 text-sm mb-4">An error occurred while fetching ratings</p>
        <Button onClick={fetchRatings} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Ratings from Cleaners</h3>
          <p className="text-gray-600 text-sm">
            {ratings.length} rating{ratings.length !== 1 ? 's' : ''} received
          </p>
        </div>
        {ratings.length > 0 && (
          <div className="flex items-center gap-4 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold text-gray-900">{averageRating}</span>
              </div>
              <p className="text-xs text-gray-600">Average Rating</p>
            </div>
          </div>
        )}
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg space-y-4">
          <Star className="w-10 h-10 text-gray-400 mx-auto" />
          <div>
            <h4 className="text-md font-semibold text-gray-900">No ratings yet</h4>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Once you book a service and it’s completed, your cleaner’s rating will appear here.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-2 pb-2">
            <Button asChild className="sm:min-w-[160px]">
              <Link href="/booking/service/select">Book a service</Link>
            </Button>
            <Button variant="outline" asChild className="sm:min-w-[160px]">
              <Link href="/contact">Talk to support</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((rating) => (
            <Card key={rating.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left: Rating & Cleaner */}
                  <div className="sm:w-1/3 space-y-3">
                    {/* Rating */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rating</p>
                      {renderStars(rating.rating)}
                    </div>

                    {/* Cleaner */}
                    {rating.cleaners && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">From Cleaner</p>
                        <div className="flex items-center gap-2">
                          {rating.cleaners.photo_url ? (
                            <img
                              src={rating.cleaners.photo_url}
                              alt={rating.cleaners.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {rating.cleaners.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Booking Details */}
                  {rating.bookings && (
                    <div className="sm:w-2/3 space-y-2">
                      <p className="text-xs text-gray-500 mb-1">Booking Details</p>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {rating.bookings.service_type}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {rating.bookings.address_line1}, {rating.bookings.address_suburb}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(rating.bookings.booking_date).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <p className="text-xs text-gray-500">
                          Rated on {new Date(rating.created_at).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
