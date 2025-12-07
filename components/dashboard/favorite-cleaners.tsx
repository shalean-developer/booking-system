'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Star, User, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { devLog } from '@/lib/dev-logger';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FavoriteCleaner {
  id: string;
  customer_id: string;
  cleaner_id: string;
  created_at: string;
  cleaner_name: string;
  cleaner_photo_url: string | null;
  cleaner_rating: number;
  cleaner_years_experience: number | null;
  cleaner_areas: string[];
  cleaner_bio: string | null;
  cleaner_is_active: boolean;
}

export function FavoriteCleaners() {
  const [favorites, setFavorites] = useState<FavoriteCleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to view favorite cleaners');
        return;
      }

      const response = await fetch('/api/dashboard/favorites', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setFavorites(data.favorites || []);
      } else {
        toast.error(data.error || 'Failed to load favorite cleaners');
      }
    } catch (error) {
      devLog.error('Error fetching favorite cleaners:', error);
      toast.error('Failed to load favorite cleaners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (cleanerId: string) => {
    try {
      setRemovingId(cleanerId);
      const session = await safeGetSession(supabase);
      if (!session?.session) {
        toast.error('Please log in to remove favorites');
        return;
      }

      const response = await fetch(`/api/dashboard/favorites?cleaner_id=${encodeURIComponent(cleanerId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setFavorites(favorites.filter(fav => fav.cleaner_id !== cleanerId));
        toast.success('Removed from favorites');
      } else {
        toast.error(data.error || 'Failed to remove favorite');
      }
    } catch (error) {
      devLog.error('Error removing favorite cleaner:', error);
      toast.error('Failed to remove favorite');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-teal-600" />
            Favorite Cleaners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-teal-600" />
          Favorite Cleaners
        </CardTitle>
        <CardDescription>
          Your preferred cleaners will appear first when booking. Add favorites from the cleaner selection page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No favorite cleaners yet</p>
            <p className="text-sm text-gray-500">
              When booking, you can favorite cleaners you'd like to work with again.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Cleaner Photo */}
                <div className="relative flex-shrink-0">
                  {favorite.cleaner_photo_url ? (
                    <Image
                      src={favorite.cleaner_photo_url}
                      alt={favorite.cleaner_name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover border-2 border-teal-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center border-2 border-teal-100">
                      <User className="w-7 h-7 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Cleaner Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {favorite.cleaner_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {favorite.cleaner_rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Experience */}
                    {favorite.cleaner_years_experience && (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {favorite.cleaner_years_experience} years
                        </span>
                      </div>
                    )}

                    {/* Areas */}
                    {favorite.cleaner_areas && favorite.cleaner_areas.length > 0 && (
                      <span className="text-xs text-gray-500 truncate">
                        {favorite.cleaner_areas.slice(0, 2).join(', ')}
                        {favorite.cleaner_areas.length > 2 && '...'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFavorite(favorite.cleaner_id)}
                  disabled={removingId === favorite.cleaner_id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {removingId === favorite.cleaner_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
