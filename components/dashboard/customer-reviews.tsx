'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { devLog } from '@/lib/dev-logger';
import { 
  Star, 
  Calendar, 
  User, 
  MapPin,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { LoadingSpinner } from './loading-spinner';
import { devLog } from '@/lib/dev-logger';

interface Review {
  id: string;
  booking_id: string;
  cleaner_id: string;
  overall_rating: number;
  quality_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  review_text: string | null;
  photos: string[] | null;
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

export function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      console.log('🟦 [CustomerReviews] Starting fetchReviews...');
      setIsLoading(true);
      setError(null);

      console.log('🟦 [CustomerReviews] Making API request to /api/dashboard/reviews');
      const response = await fetch('/api/dashboard/reviews');
      console.log('🟦 [CustomerReviews] API response status:', response.status);
      console.log('🟦 [CustomerReviews] API response ok:', response.ok);

      const data = await response.json();
      console.log('🟦 [CustomerReviews] API response data:', JSON.stringify(data, null, 2));

      if (!data.ok) {
        console.log('🟥 [CustomerReviews] API returned error:', data.error);
        console.log('🟥 [CustomerReviews] Error details:', data.details);
        console.log('🟥 [CustomerReviews] Error code:', data.code);
        throw new Error(data.details || data.error || 'Failed to fetch reviews');
      }

      const reviewsData = data.reviews || [];
      console.log('🟩 [CustomerReviews] Successfully fetched reviews:', reviewsData.length);
      console.log('🟩 [CustomerReviews] Reviews data:', reviewsData);
      
      if (reviewsData.length === 0) {
        console.log('🟨 [CustomerReviews] Warning: No reviews found');
      }

      setReviews(reviewsData);
    } catch (err) {
      devLog.error('🟥 [CustomerReviews] Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
      devLog.debug('🟦 [CustomerReviews] fetchReviews completed');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">({rating}/5)</span>
      </div>
    );
  };

  const averageOverallRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="md" text="Loading your reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 mb-2 font-semibold">Failed to load reviews</div>
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <p className="text-gray-600 text-xs mb-4">Check browser console for more details</p>
        <Button onClick={fetchReviews} variant="outline" size="sm">
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
          <h3 className="text-lg font-semibold text-gray-900">My Reviews</h3>
          <p className="text-gray-600 text-sm">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} written
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-blue-400 text-blue-400" />
                <span className="text-lg font-bold text-gray-900">{averageOverallRating}</span>
              </div>
              <p className="text-xs text-gray-600">Average Rating Given</p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg space-y-4">
          <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              After your first clean, you’ll be able to leave feedback here to help your cleaner improve.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pb-2">
            <Button asChild className="sm:min-w-[160px]">
              <Link href="/booking/service/select">Book a service</Link>
            </Button>
            <Button variant="outline" asChild className="sm:min-w-[160px]">
              <Link href="/contact">Need recommendations?</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header: Cleaner & Overall Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.cleaners && (
                        <>
                          {review.cleaners.photo_url ? (
                            <img
                              src={review.cleaners.photo_url}
                              alt={review.cleaners.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">{review.cleaners.name}</h4>
                            <p className="text-sm text-gray-600">Cleaner</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Overall Rating</div>
                        {renderStars(review.overall_rating)}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quality</p>
                      {renderStars(review.quality_rating)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Punctuality</p>
                      {renderStars(review.punctuality_rating)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Professionalism</p>
                      {renderStars(review.professionalism_rating)}
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.review_text && (
                    <div className="py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
                    </div>
                  )}

                  {/* Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="py-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Photos ({review.photos.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {review.photos.map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Details */}
                  {review.bookings && (
                    <div className="py-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Service Details</p>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {review.bookings.service_type}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {review.bookings.address_line1}, {review.bookings.address_suburb}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.bookings.booking_date).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {review.bookings.booking_time}
                        </div>
                        <p className="text-xs text-gray-500">
                          Reviewed on {new Date(review.created_at).toLocaleDateString('en-ZA', {
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
