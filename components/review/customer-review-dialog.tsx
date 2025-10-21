'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRatingInput } from './star-rating-input';
import { PhotoUpload } from './photo-upload';
import { supabase } from '@/lib/supabase-client';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  cleaner_id: string | null;
}

interface CustomerReviewDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReviewData {
  overallRating: number;
  qualityRating: number;
  punctualityRating: number;
  professionalismRating: number;
  reviewText: string;
  photos: File[];
}

export function CustomerReviewDialog({
  booking,
  open,
  onClose,
  onSuccess,
}: CustomerReviewDialogProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({
    overallRating: 0,
    qualityRating: 0,
    punctualityRating: 0,
    professionalismRating: 0,
    reviewText: '',
    photos: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setReviewData({
        overallRating: 0,
        qualityRating: 0,
        punctualityRating: 0,
        professionalismRating: 0,
        reviewText: '',
        photos: [],
      });
      setError(null);
      setIsSuccess(false);
      onClose();
    }
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const uploadPhotos = async (bookingId: string): Promise<string[]> => {
    const photoUrls: string[] = [];

    for (let i = 0; i < reviewData.photos.length; i++) {
      const photo = reviewData.photos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${bookingId}-${Date.now()}-${i}.${fileExt}`;
      const filePath = `${bookingId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('review-photos')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading photo:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(filePath);

      photoUrls.push(publicUrl);
    }

    return photoUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!booking) return;

    // Validation
    if (
      reviewData.overallRating === 0 ||
      reviewData.qualityRating === 0 ||
      reviewData.punctualityRating === 0 ||
      reviewData.professionalismRating === 0
    ) {
      setError('Please provide ratings for all criteria');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first (if any)
      let photoUrls: string[] = [];
      if (reviewData.photos.length > 0) {
        try {
          photoUrls = await uploadPhotos(booking.id);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          
          // Check if it's a bucket error - allow submission without photos
          if (errorMessage.includes('Bucket not found')) {
            console.warn('Storage bucket not configured, skipping photo upload');
            setError('Photo upload unavailable. Submitting review without photos.');
            // Continue with submission, photoUrls remains empty
          } else {
            // Other errors should still block submission
            throw new Error('Failed to upload photos. Please try again or remove photos to submit.');
          }
        }
      }

      // Submit review via API with timeout
      const response = await fetchWithTimeout(`/api/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overallRating: reviewData.overallRating,
          qualityRating: reviewData.qualityRating,
          punctualityRating: reviewData.punctualityRating,
          professionalismRating: reviewData.professionalismRating,
          reviewText: reviewData.reviewText.trim() || null,
          photos: photoUrls,
        }),
      }, 30000);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Failed to submit review (${response.status})`);
      }

      // Show success state
      setIsSuccess(true);

      // Close after short delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.');
    } finally {
      // Always reset submitting state
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          // Success State
          <div className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You for Your Review!
            </h3>
            <p className="text-gray-600">
              Your feedback helps us improve our service.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Rate Your Cleaner</DialogTitle>
              <DialogDescription className="text-base">
                How was your cleaning service on{' '}
                {new Date(booking.booking_date).toLocaleDateString()} at{' '}
                {booking.booking_time}?
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Overall Rating */}
              <StarRatingInput
                label="Overall Experience"
                value={reviewData.overallRating}
                onChange={(rating) =>
                  setReviewData({ ...reviewData, overallRating: rating })
                }
                required
              />

              {/* Quality Rating */}
              <StarRatingInput
                label="Quality of Cleaning"
                value={reviewData.qualityRating}
                onChange={(rating) =>
                  setReviewData({ ...reviewData, qualityRating: rating })
                }
                required
              />

              {/* Punctuality Rating */}
              <StarRatingInput
                label="Punctuality"
                value={reviewData.punctualityRating}
                onChange={(rating) =>
                  setReviewData({ ...reviewData, punctualityRating: rating })
                }
                required
              />

              {/* Professionalism Rating */}
              <StarRatingInput
                label="Professionalism"
                value={reviewData.professionalismRating}
                onChange={(rating) =>
                  setReviewData({ ...reviewData, professionalismRating: rating })
                }
                required
              />

              {/* Review Text */}
              <div className="space-y-2">
                <label
                  htmlFor="review-text"
                  className="block text-sm font-medium text-gray-700"
                >
                  Written Review (Optional)
                </label>
                <Textarea
                  id="review-text"
                  placeholder="Share more details about your experience..."
                  value={reviewData.reviewText}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, reviewText: e.target.value })
                  }
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Photo Upload */}
              <PhotoUpload
                photos={reviewData.photos}
                onPhotosChange={(photos) =>
                  setReviewData({ ...reviewData, photos })
                }
              />

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

