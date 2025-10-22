'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  } | null;
  cleaners: {
    id: string;
    name: string;
    photo_url: string | null;
  } | null;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface CustomerRating {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_phone: string | null;
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

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customerRatings, setCustomerRatings] = useState<CustomerRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsLoadingRatings(true);

      const response = await fetch('/api/admin/reviews', {
        credentials: 'include', // Include cookies for server-side auth
      });
      
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      // Transform the data to match our interfaces
      const transformedReviews: Review[] = (data.reviews || []).map((item: any) => ({
        id: item.id,
        booking_id: item.booking_id,
        overall_rating: item.overall_rating,
        quality_rating: item.quality_rating,
        punctuality_rating: item.punctuality_rating,
        professionalism_rating: item.professionalism_rating,
        review_text: item.review_text,
        photos: item.photos || [],
        created_at: item.created_at,
        bookings: item.bookings || null,
        cleaners: item.cleaners || null,
        users: item.users || null,
      }));

      const transformedRatings: CustomerRating[] = (data.customerRatings || []).map((item: any) => ({
        id: item.id,
        booking_id: item.booking_id,
        rating: item.rating,
        comment: item.comment,
        created_at: item.created_at,
        customer_phone: item.customer_phone,
        bookings: item.bookings || null,
        cleaners: item.cleaners || null,
      }));

      setReviews(transformedReviews);
      setCustomerRatings(transformedRatings);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingRatings(false);
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
      </div>
    );
  }

  const averageCustomerRating = customerRatings.length > 0
    ? (customerRatings.reduce((sum, r) => sum + r.rating, 0) / customerRatings.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
        <p className="text-gray-600 mt-1">Manage all customer reviews and cleaner ratings</p>
      </div>

      <Tabs defaultValue="customer-reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer-reviews">
            <Star className="h-4 w-4 mr-2" />
            Customer Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="customer-ratings">
            <MessageSquare className="h-4 w-4 mr-2" />
            Customer Ratings ({customerRatings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer-reviews" className="space-y-6">
          {/* Customer Reviews Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
              <p className="text-gray-600 text-sm">
                How customers rated cleaners
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

          {/* Customer Reviews List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Customer reviews will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Customer & Cleaner Info */}
                    <div className="lg:w-1/3 space-y-4">
                      {/* Customer */}
                      {review.users && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Customer</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {review.users.first_name} {review.users.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{review.users.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cleaner */}
                      {review.cleaners && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cleaner</p>
                          <div className="flex items-center gap-2">
                            {review.cleaners.photo_url ? (
                              <img
                                src={review.cleaners.photo_url}
                                alt={review.cleaners.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <p className="font-semibold text-gray-900 text-sm">
                              {review.cleaners.name}
                            </p>
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
                          <p className="text-sm font-semibold text-gray-700 mb-2">Review</p>
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
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customer-ratings" className="space-y-6">
          {/* Customer Ratings Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Ratings</h3>
              <p className="text-gray-600 text-sm">
                How cleaners rated customers
              </p>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-blue-400 text-blue-400" />
                  <span className="text-2xl font-bold text-gray-900">{averageCustomerRating}</span>
                </div>
                <p className="text-xs text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>

          {/* Customer Ratings List */}
          {isLoadingRatings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customerRatings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ratings yet</h3>
              <p className="text-gray-600">Customer ratings will appear here once cleaners submit them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Customer & Cleaner Info */}
                    <div className="lg:w-1/3 space-y-4">
                      {/* Customer */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {rating.customer_phone || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">Phone: {rating.customer_phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Cleaner */}
                      {rating.cleaners && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cleaner</p>
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
                            <p className="font-semibold text-gray-900 text-sm">
                              {rating.cleaners.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Booking Info */}
                      {rating.bookings && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Booking</p>
                          <p className="text-sm font-medium text-gray-900">
                            {rating.bookings.service_type}
                          </p>
                          <p className="text-xs text-gray-600">
                            {rating.bookings.address_line1}, {rating.bookings.address_suburb}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(rating.bookings.booking_date).toLocaleDateString('en-ZA', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Rated on {new Date(rating.created_at).toLocaleDateString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Right: Rating & Comment */}
                    <div className="lg:w-2/3 space-y-4">
                      {/* Rating */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Rating</p>
                        {renderStars(rating.rating)}
                      </div>

                      {/* Comment */}
                      {rating.comment && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            Comment
                          </p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {rating.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

