'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { ReviewCardSkeleton } from './review-card-skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  booking_id: string;
  cleaner_id: string;
  customer_id: string;
  overall_rating: number;
  quality_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  review_text: string | null;
  photos: string[];
  cleaner_response: string | null;
  cleaner_response_at: string | null;
  created_at: string;
  bookings?: {
    id: string;
    booking_date: string;
    booking_time: string;
    service_type: string;
    customer_name: string | null;
    customer_email: string | null;
  };
  users?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ReviewsViewProps {
  bookingId?: string; // Optional: filter by booking
}

export function ReviewsView({ bookingId }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [bookingId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = bookingId
        ? `/api/cleaner/reviews?booking_id=${bookingId}`
        : '/api/cleaner/reviews';
      const response = await fetch(url, {
        // Cache reviews for 30 seconds (they don't change often)
        cache: 'default',
        next: { revalidate: 30 },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.ok) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading reviews';
      
      // Check if it's a network error
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cleaner/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: responseText.trim() }),
      });

      const data = await response.json();
      if (data.ok) {
        setRespondingTo(null);
        setResponseText('');
        fetchReviews(); // Refresh reviews
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      alert('An error occurred while submitting response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-3 mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div className="space-y-1">
            <p className="text-red-600 font-medium">Failed to load reviews</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
        <Button onClick={fetchReviews} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 font-medium mb-1">No reviews yet</p>
        <p className="text-sm text-gray-500">
          Reviews will appear here once customers rate your service
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const customerName =
          review.bookings?.customer_name ||
          review.users?.name ||
          'Customer';
        const bookingDate = review.bookings?.booking_date;
        const serviceType = review.bookings?.service_type;

        return (
          <div
            key={review.id}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{customerName}</div>
                {bookingDate && (
                  <div className="text-sm text-gray-500">
                    {new Date(bookingDate).toLocaleDateString()} • {serviceType}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(review.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {renderStars(review.overall_rating)}
                  <span className="text-sm font-medium ml-1">
                    {review.overall_rating}.0
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-600">Quality</div>
                {renderStars(review.quality_rating)}
              </div>
              <div>
                <div className="text-gray-600">Punctuality</div>
                {renderStars(review.punctuality_rating)}
              </div>
              <div>
                <div className="text-gray-600">Professionalism</div>
                {renderStars(review.professionalism_rating)}
              </div>
            </div>

            {/* Review Text */}
            {review.review_text && (
              <div className="text-gray-700 whitespace-pre-wrap">
                {review.review_text}
              </div>
            )}

            {/* Photos */}
            {review.photos && review.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {review.photos.map((photo, idx) => (
                  <a
                    key={idx}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded overflow-hidden border border-gray-200"
                  >
                    <img
                      src={photo}
                      alt={`Review photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Cleaner Response */}
            {review.cleaner_response ? (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Your Response
                  </span>
                  {review.cleaner_response_at && (
                    <span className="text-xs text-blue-600">
                      {formatDate(review.cleaner_response_at)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-blue-900 whitespace-pre-wrap">
                  {review.cleaner_response}
                </div>
              </div>
            ) : (
              <div className="mt-3">
                {respondingTo === review.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write a response to this review..."
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmitResponse(review.id)}
                        disabled={!responseText.trim() || isSubmitting}
                        className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                        size="sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Response'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setRespondingTo(review.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Respond to Review
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

