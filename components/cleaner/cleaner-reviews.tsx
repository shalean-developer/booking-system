'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Loader2, 
  Calendar, 
  User, 
  Image as ImageIcon,
  Eye,
  X,
  MessageSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  booking_id: string;
  overall_rating: number;
  quality_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  review_text: string | null;
  photos: string[];
  created_at: string;
  bookings: {
    booking_date: string;
    booking_time: string;
    service_type: string;
    address_line1: string;
    address_suburb: string;
    address_city: string;
  } | null;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export function CleanerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/cleaner/reviews');
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
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
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading your reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 mb-2">Failed to load reviews</div>
        <p className="text-red-500 text-sm mb-4">{error}</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-gray-600 mt-1">
            {reviews.length} recent review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-amber-50 px-6 py-3 rounded-lg border border-amber-200">
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
            </div>
            <p className="text-xs text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">Customer reviews will appear here once submitted.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Customer & Booking Info */}
                  <div className="lg:w-1/3 space-y-4">
                    {/* Customer */}
                    {review.customers && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {review.customers.first_name} {review.customers.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{review.customers.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Booking Info */}
                    {review.bookings && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Booking</p>
                        <p className="text-sm font-medium text-gray-900">
                          {review.bookings.service_type}
                        </p>
                        <p className="text-xs text-gray-600">
                          {review.bookings.address_line1}, {review.bookings.address_suburb}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.bookings.booking_date).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Reviewed {new Date(review.created_at).toLocaleDateString('en-ZA', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Right: Ratings & Review */}
                  <div className="lg:w-2/3 space-y-4">
                    {/* Overall Rating */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Overall Rating</p>
                      {renderStars(review.overall_rating)}
                    </div>

                    {/* Detailed Ratings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Quality</p>
                        {renderStars(review.quality_rating)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Punctuality</p>
                        {renderStars(review.punctuality_rating)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Professionalism</p>
                        {renderStars(review.professionalism_rating)}
                      </div>
                    </div>

                    {/* Review Text */}
                    {review.review_text && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          Review
                        </p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {review.review_text}
                        </p>
                      </div>
                    )}

                    {/* Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Photos ({review.photos.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {review.photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedPhoto(photo);
                                setPhotoViewerOpen(true);
                              }}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary transition-all group"
                            >
                              <img
                                src={photo}
                                alt={`Review photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Review photo"
                className="w-full h-auto rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setPhotoViewerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
