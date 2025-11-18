'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  DollarSign,
  Package,
  FileText,
  Navigation,
  Repeat,
  X,
  MessageSquare,
  Star,
} from 'lucide-react';
import type { CleanerBooking } from '@/types/booking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const BookingChat = dynamic(() => import('./booking-chat').then(mod => ({ default: mod.BookingChat })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading chat...</div>,
  ssr: false,
});

const ReviewsView = dynamic(() => import('./reviews-view').then(mod => ({ default: mod.ReviewsView })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading reviews...</div>,
  ssr: false,
});

interface Booking extends CleanerBooking {
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_rating_id?: string | null;
}

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
}: BookingDetailsModalProps) {
  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('details');

  // Checklist (service-type presets) with local persistence per booking
  const defaultChecklistByService: Record<string, string[]> = {
    Standard: [
      'Kitchen surfaces wiped',
      'Bathroom cleaned',
      'Floors vacuumed/mopped',
      'Dust all visible surfaces',
    ],
    Deep: [
      'Inside oven cleaned',
      'Inside fridge cleaned',
      'Baseboards and skirtings',
      'Window sills wiped',
    ],
    'Move In/Out': [
      'Inside cupboards and drawers',
      'Appliances cleaned',
      'Floors and tiles scrubbed',
      'Bathrooms descaled',
    ],
    Airbnb: [
      'Beds made with clean linen',
      'Amenities restocked',
      'Trash removed',
      'Surfaces disinfected',
    ],
  };

  type ChecklistItem = { label: string; done: boolean };
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!booking?.id) return;
    const key = `booking_checklist_${booking.id}`;
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
        return;
      } catch {}
    }
    // Initialize from service type preset
    const service = (booking.service_type || 'Standard').trim();
    const preset =
      defaultChecklistByService[service] ||
      defaultChecklistByService.Standard;
    setChecklist(preset.map((label) => ({ label, done: false })));
  }, [booking?.id, booking?.service_type]);

  useEffect(() => {
    if (!booking?.id) return;
    const key = `booking_checklist_${booking.id}`;
    try {
      window.localStorage.setItem(key, JSON.stringify(checklist));
    } catch {}
  }, [booking?.id, checklist]);

  const toggleItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((it, i) => (i === index ? { ...it, done: !it.done } : it))
    );
  };

  const completed = checklist.filter((i) => i.done).length;
  const total = checklist.length;

  // Issue / dispute reporting
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueNotes, setIssueNotes] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Photos (before/after) persisted locally (paths) for now
  type Photo = { path: string; url?: string };
  const [beforePhotos, setBeforePhotos] = useState<Photo[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<Photo[]>([]);
  const supabase = createSupabaseBrowserClient();
  const MAX_TOTAL_PHOTOS = 10;

  useEffect(() => {
    if (!booking?.id) return;
    try {
      const b = window.localStorage.getItem(`booking_photos_before_${booking.id}`);
      const a = window.localStorage.getItem(`booking_photos_after_${booking.id}`);
      if (b) setBeforePhotos(JSON.parse(b));
      if (a) setAfterPhotos(JSON.parse(a));

      // Resolve signed URLs for existing paths
      const resolveSigned = async () => {
        const extractPathFromUrl = (url: string): string | null => {
          try {
            const u = new URL(url);
            // Common Supabase public URL forms:
            // https://<ref>.supabase.co/storage/v1/object/public/booking-photos/<path>
            // or edge CDN variants
            const publicIdx = u.pathname.indexOf('/object/public/booking-photos/');
            if (publicIdx !== -1) {
              const sub = u.pathname.substring(publicIdx + '/object/public/'.length); // booking-photos/<path>
              return sub.startsWith('booking-photos/') ? sub : `booking-photos/${sub}`;
            }
            // Direct path already?
            if (u.pathname.startsWith('/booking-photos/')) {
              return `booking-photos${u.pathname.replace('/booking-photos', '')}`;
            }
          } catch {}
          return null;
        };

        const resolveList = async (list: Photo[]) => {
          const updated: Photo[] = [];
          for (const p of list) {
            let normalizedPath = p.path || '';
            if (!normalizedPath && p.url) {
              const derived = extractPathFromUrl(p.url);
              if (derived) normalizedPath = derived;
            }
            if (!normalizedPath) {
              // Skip items with neither path nor derivable path in private-only mode
              continue;
            }
            // path must be "bucket/dir/file"
            // If previous saves stored path without bucket (legacy), assume bucket "booking-photos"
            const normalized = normalizedPath.includes('/') ? normalizedPath : `booking-photos/${normalizedPath}`;
            try {
              const res = await fetch('/api/storage/signed-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: normalized, expiresIn: 3600 }),
              });
              const data = await res.json();
              if (res.ok && data.ok) {
                updated.push({ path: normalized, url: data.signedUrl });
              } else {
                updated.push({ path: normalized });
              }
            } catch {
              updated.push({ path: normalized });
            }
          }
          return updated;
        };
        setBeforePhotos((prev) => prev.filter(Boolean));
        setAfterPhotos((prev) => prev.filter(Boolean));
        const [b2, a2] = await Promise.all([resolveList(beforePhotos), resolveList(afterPhotos)]);
        setBeforePhotos(b2);
        setAfterPhotos(a2);
      };

      // kick off async
      void resolveSigned();
    } catch {}
  }, [booking?.id]);

  // Hourly auto-refresh of signed URLs while the modal is open
  useEffect(() => {
    if (!isOpen || !booking?.id) return;

    let canceled = false;
    const refresh = async () => {
      // re-request fresh signed URLs for current paths
      const signFor = async (list: Photo[]) => {
        const updated: Photo[] = [];
        for (const p of list) {
          if (!p.path) continue;
          const normalized = p.path.includes('/') ? p.path : `booking-photos/${p.path}`;
          try {
            const res = await fetch('/api/storage/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: normalized, expiresIn: 3600 }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
              updated.push({ path: normalized, url: data.signedUrl });
            } else {
              updated.push({ path: normalized });
            }
          } catch {
            updated.push({ path: normalized });
          }
        }
        return updated;
      };

      const [bNew, aNew] = await Promise.all([signFor(beforePhotos), signFor(afterPhotos)]);
      if (!canceled) {
        setBeforePhotos(bNew);
        setAfterPhotos(aNew);
      }
    };

    // immediate refresh when opened
    void refresh();
    // then hourly (55 minutes to be safe)
    const id = setInterval(refresh, 55 * 60 * 1000);
    return () => {
      canceled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking?.id, beforePhotos.length, afterPhotos.length]);

  useEffect(() => {
    if (!booking?.id) return;
    try {
      window.localStorage.setItem(`booking_photos_before_${booking.id}`, JSON.stringify(beforePhotos));
      window.localStorage.setItem(`booking_photos_after_${booking.id}`, JSON.stringify(afterPhotos));
    } catch {}
  }, [booking?.id, beforePhotos, afterPhotos]);

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Client-side image compression using canvas
  const compressImage = async (file: File): Promise<{ blob: Blob; suggestedName: string; mime: string }> => {
    // Use WebP for better compression across types
    const outputMime = 'image/webp';
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = objectUrl;
      });
      // Resize to fit within 1280px box while preserving aspect ratio
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('Canvas context not available');
      ctx.drawImage(img, 0, 0, width, height);
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
          outputMime,
          0.8 // quality
        );
      });
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const suggestedName = `${baseName}.webp`;
      return { blob, suggestedName, mime: outputMime };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const uploadPhotos = async (files: FileList, type: 'before' | 'after') => {
    if (!booking?.id || !files?.length) return;

    // Enforce total photo limit across before + after
    const currentTotal = beforePhotos.length + afterPhotos.length;
    const remaining = Math.max(0, MAX_TOTAL_PHOTOS - currentTotal);
    if (remaining <= 0) {
      alert(`You can upload up to ${MAX_TOTAL_PHOTOS} photos per booking.`);
      return;
    }
    const filesToProcess = Array.from(files).slice(0, remaining);
    const skippedForLimit = files.length - filesToProcess.length;

    const uploads: Photo[] = [];
    const invalids: string[] = [];
    for (const file of filesToProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        invalids.push(`${file.name} (type not allowed)`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        invalids.push(`${file.name} (exceeds 5MB)`);
        continue;
      }
      // Compress before upload (converts to webp ~ smaller size)
      let compressed: { blob: Blob; suggestedName: string; mime: string };
      try {
        compressed = await compressImage(file);
      } catch (e) {
        // Fallback to original file if compression fails
        compressed = { blob: file, suggestedName: file.name, mime: file.type };
      }
      const safeName = compressed.suggestedName.replace(/[^\w.\-]/g, '_');
      const fd = new FormData();
      const outFile = new File([compressed.blob], safeName, { type: compressed.mime });
      fd.append('file', outFile);
      fd.append('bookingId', booking.id);
      fd.append('kind', type);
      try {
        const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.ok && data.path) {
          uploads.push({ path: data.path, url: data.signedUrl });
        }
      } catch {}
    }
    if (type === 'before') setBeforePhotos((p) => [...uploads, ...p]);
    else setAfterPhotos((p) => [...uploads, ...p]);

    if (invalids.length || skippedForLimit > 0) {
      const parts: string[] = [];
      if (invalids.length) parts.push(`Invalid files:\n- ${invalids.join('\n- ')}`);
      if (skippedForLimit > 0) parts.push(`Skipped ${skippedForLimit} file(s) due to the ${MAX_TOTAL_PHOTOS} photo limit.`);
      alert(parts.join('\n\n'));
    }
  };

  const removePhoto = async (type: 'before' | 'after', index: number) => {
    const list = type === 'before' ? beforePhotos : afterPhotos;
    const photo = list[index];
    if (!photo) return;
    try {
      const key = photo.path.startsWith('booking-photos/') ? photo.path.replace('booking-photos/', '') : photo.path;
      await supabase.storage.from('booking-photos').remove([key]);
    } catch {}
    if (type === 'before') {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const submitIssue = async () => {
    if (!booking?.id || !issueNotes.trim()) return;
    setSubmittingIssue(true);
    try {
      const res = await fetch(`/api/cleaner/bookings/${booking.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: issueNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit issue');
      }
      setIssueOpen(false);
      setIssueNotes('');
      alert('Issue submitted');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to submit issue');
    } finally {
      setSubmittingIssue(false);
    }
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM
  };

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (earnings: number | null) => {
    if (!earnings) return 'TBD';
    return `R${(earnings / 100).toFixed(2)}`;
  };

  const getFullAddress = () => {
    if (!booking) return '';
    return [booking.address_line1, booking.address_suburb, booking.address_city]
      .filter(Boolean)
      .join(', ');
  };

  const openMaps = () => {
    const address = getFullAddress();
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getStatusBadge = () => {
    if (!booking) return null;
    switch (booking.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      default:
        return <Badge>{bookingData.status}</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom-weekly':
        return 'Custom Weekly';
      case 'custom-bi-weekly':
        return 'Custom Bi-weekly';
      default:
        return 'Recurring';
    }
  };

  const getDayOfWeekLabel = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Early return after all hooks are called
  if (!booking) return null;

  // TypeScript type guard: booking is now guaranteed to be non-null
  const bookingData = booking;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-2">
                Booking Details
              </DialogTitle>
              <div className="text-sm text-gray-500">ID: {bookingData.id}</div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 py-4">
          {/* Service Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Service Information
            </h3>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <div className="text-sm text-gray-500">Service Type</div>
                <div className="font-medium">
                  {bookingData.service_type || 'Cleaning Service'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Your Earnings</div>
                <div className="font-medium text-primary">
                  {formatAmount(bookingData.cleaner_earnings)}
                </div>
                {/* Show tip only if customer gave a tip */}
                {bookingData.tip_amount && bookingData.tip_amount > 0 && (
                  <div className="text-xs text-yellow-600 font-medium mt-1 flex items-center gap-1">
                    <span>💰</span>
                    <span>+{formatAmount(bookingData.tip_amount)} tip</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{formatDate(booking.booking_date)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Time</div>
                <div className="font-medium">{formatTime(booking.booking_time)}</div>
              </div>
            </div>
          </div>

          {/* Recurring Schedule Info */}
          {bookingData.recurring_schedule && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Recurring Schedule
              </h3>
              <div className="ml-7 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {getFrequencyLabel(bookingData.recurring_schedule.frequency)}
                  </Badge>
                  {!bookingData.recurring_schedule.is_active && (
                    <Badge variant="outline" className="bg-gray-100">
                      Paused
                    </Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  {bookingData.recurring_schedule.day_of_week !== null && bookingData.recurring_schedule.day_of_week !== undefined ? (
                    <div>
                      <span className="text-gray-500">Repeats on:</span>{' '}
                      <span className="font-medium">
                        {getDayOfWeekLabel(bookingData.recurring_schedule.day_of_week)}
                      </span>
                    </div>
                  ) : null}
                  {bookingData.recurring_schedule.day_of_month !== undefined && (
                    <div>
                      <span className="text-gray-500">Day of month:</span>{' '}
                      <span className="font-medium">
                        {bookingData.recurring_schedule.day_of_month}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Started:</span>{' '}
                    <span className="font-medium">
                      {new Date(bookingData.recurring_schedule.start_date).toLocaleDateString('en-ZA')}
                    </span>
                  </div>
                  {bookingData.recurring_schedule.end_date && (
                    <div>
                      <span className="text-gray-500">Ends:</span>{' '}
                      <span className="font-medium">
                        {new Date(bookingData.recurring_schedule.end_date).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    This booking is part of a recurring schedule
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Checklist */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Checklist</h3>
          <div className="ml-7">
            <div className="text-xs text-gray-500 mb-2">
              {completed}/{total} completed
            </div>
            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() => toggleItem(idx)}
                    className="h-4 w-4"
                  />
                  <span className={item.done ? 'line-through text-gray-400' : ''}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Report an Issue */}
        <div className="pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={() => setIssueOpen(true)} className="w-full sm:w-auto">
            Report an issue
          </Button>
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Photos</h3>
          <div className="ml-7 text-xs text-gray-500 mb-2">
            Max {MAX_TOTAL_PHOTOS} photos total (before + after). Max 5MB each. Allowed: JPG, PNG, WEBP.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-7">
            <div>
              <div className="text-sm text-gray-500 mb-2">Before</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && uploadPhotos(e.target.files, 'before')}
                className="block text-xs"
              />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {beforePhotos.map((p, i) => (
                  <div key={i} className="relative group">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        <img 
                          src={p.url} 
                          alt={`before-${i}`} 
                          className="h-16 w-16 object-cover rounded border"
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    ) : (
                      <div className="h-16 w-16 rounded border flex items-center justify-center text-[10px] text-gray-500">
                        Pending link
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto('before', i)}
                      className="absolute -top-2 -right-2 bg-white/90 border border-gray-300 rounded-full p-0.5 shadow hidden group-hover:block"
                      aria-label="Remove photo"
                      title="Remove"
                    >
                      <X className="h-3 w-3 text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">After</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && uploadPhotos(e.target.files, 'after')}
                className="block text-xs"
              />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {afterPhotos.map((p, i) => (
                  <div key={i} className="relative group">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        <img 
                          src={p.url} 
                          alt={`after-${i}`} 
                          className="h-16 w-16 object-cover rounded border"
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    ) : (
                      <div className="h-16 w-16 rounded border flex items-center justify-center text-[10px] text-gray-500">
                        Pending link
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto('after', i)}
                      className="absolute -top-2 -right-2 bg-white/90 border border-gray-300 rounded-full p-0.5 shadow hidden group-hover:block"
                      aria-label="Remove photo"
                      title="Remove"
                    >
                      <X className="h-3 w-3 text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="space-y-2 ml-7">
              {bookingData.customer_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{bookingData.customer_name}</span>
                </div>
              )}
              {bookingData.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${bookingData.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {bookingData.customer_phone}
                  </a>
                </div>
              )}
              {bookingData.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${bookingData.customer_email}`}
                    className="text-primary hover:underline"
                  >
                    {bookingData.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </h3>
            <div className="ml-7">
              <div className="text-gray-700">{getFullAddress()}</div>
              <Button
                onClick={openMaps}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </h3>
            <div className="ml-7 space-y-2 text-sm">
              {booking.cleaner_claimed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Claimed:</span>
                  <span>{formatDateTime(booking.cleaner_claimed_at)}</span>
                </div>
              )}
              {booking.cleaner_started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Started:</span>
                  <span>{formatDateTime(booking.cleaner_started_at)}</span>
                </div>
              )}
              {booking.cleaner_completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed:</span>
                  <span>{formatDateTime(booking.cleaner_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
          </TabsContent>

          <TabsContent value="chat" className="py-4">
            <BookingChat
              bookingId={bookingData.id}
              cleanerName="You"
              customerName={bookingData.customer_name || undefined}
            />
          </TabsContent>

          <TabsContent value="reviews" className="py-4">
            <ReviewsView bookingId={booking.id} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Issue Modal */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Describe the issue..."
              value={issueNotes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIssueNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={submittingIssue}>
              Cancel
            </Button>
            <Button onClick={submitIssue} disabled={!issueNotes.trim() || submittingIssue}>
              {submittingIssue ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

