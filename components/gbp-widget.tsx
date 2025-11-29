"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, ExternalLink, MessageSquare } from "lucide-react";

interface GBPWidgetProps {
  /**
   * Google Business Profile URL
   * Example: "https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241"
   */
  gbpUrl?: string;
  /**
   * Google Maps Place ID (for embed)
   * Get this from your GBP or extract from GBP URL
   * Example: "ChIJ..."
   */
  placeId?: string;
  /**
   * Review link URL (from GBP "Get more reviews" section)
   * Example: "https://g.page/r/..."
   */
  reviewLink?: string;
  /**
   * Average rating (optional, will show placeholder if not provided)
   */
  rating?: number;
  /**
   * Number of reviews (optional)
   */
  reviewCount?: number;
  /**
   * Business address for display
   */
  address?: string;
  /**
   * Show compact version (for sidebars)
   */
  compact?: boolean;
}

export function GBPWidget({
  gbpUrl,
  placeId,
  reviewLink,
  rating = 5.0,
  reviewCount = 500,
  address,
  compact = false,
}: GBPWidgetProps) {
  // Get GBP URL from environment or use default
  const defaultGbpUrl = process.env.NEXT_PUBLIC_GBP_URL || "https://www.google.com/maps/place/Shalean+Cleaning+Services";
  const finalGbpUrl = gbpUrl || defaultGbpUrl;

  // Get Place ID from environment or prop
  const defaultPlaceId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || placeId;

  // Generate Google Maps embed URL
  const getMapsEmbedUrl = () => {
    // If we have a Place ID, use it for the embed
    if (defaultPlaceId) {
      return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''}&q=place_id:${defaultPlaceId}`;
    }
    
    // Try to extract place ID from GBP URL
    const placeIdMatch = finalGbpUrl.match(/place\/([^/]+)/);
    if (placeIdMatch && placeIdMatch[1]) {
      const extractedPlaceId = placeIdMatch[1].split('@')[0];
      if (extractedPlaceId && extractedPlaceId !== 'Shalean+Cleaning+Services') {
        return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''}&q=place_id:${extractedPlaceId}`;
      }
    }

    // Fallback: Use search query based on business name
    return `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''}&q=Shalean+Cleaning+Services+Cape+Town`;
  };

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-lg">{rating.toFixed(1)}</span>
              <span className="text-sm text-gray-600">({reviewCount}+ reviews)</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href={finalGbpUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4 mr-2" />
                View on Google
              </Link>
            </Button>
            {reviewLink && (
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90"
                asChild
              >
                <Link href={reviewLink} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Leave a Review
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Rating & Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find Us on Google
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Shalean Cleaning Services is a trusted cleaning company in Cape Town with hundreds of satisfied customers.
                {address && (
                  <span className="block mt-2 text-sm text-gray-500">
                    {address}
                  </span>
                )}
              </p>
            </div>

            {/* Rating Display */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < Math.floor(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({reviewCount}+ reviews)
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Rated by customers on Google Business Profile
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link href={finalGbpUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-5 w-5 mr-2" />
                  View on Google Maps
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              {reviewLink && (
                <Button
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  asChild
                >
                  <Link href={reviewLink} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Leave a Review
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Right: Google Maps Embed */}
          <div className="relative h-full min-h-[400px]">
            <iframe
              src={getMapsEmbedUrl()}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "8px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full rounded-lg"
              title="Shalean Cleaning Services Location"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

