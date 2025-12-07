'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface BookingShareProps {
  bookingId: string;
  bookingTitle?: string;
}

export function BookingShare({ bookingId, bookingTitle = 'Booking' }: BookingShareProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/dashboard/bookings/${bookingId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bookingTitle} - Shalean Cleaning Services`,
          text: `View my booking details: ${bookingTitle}`,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: open share dialog
      setShareDialogOpen(true);
    }
  };

  // Generate QR code URL using a simple API
  const generateQRCode = () => {
    if (!qrCodeUrl) {
      // Using a free QR code API service
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
      setQrCodeUrl(qrApiUrl);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2"
        aria-label="Share booking"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </Button>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Booking</DialogTitle>
            <DialogDescription>
              Share this booking with others via link or QR code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">QR Code</label>
              <div className="flex flex-col items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for booking"
                    className="w-48 h-48 border border-gray-300 rounded bg-white p-2"
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={generateQRCode}
                    className="gap-2"
                    aria-label="Generate QR code"
                  >
                    <QrCode className="h-4 w-4" aria-hidden="true" />
                    Generate QR Code
                  </Button>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Scan this QR code to view the booking details
                </p>
              </div>
            </div>

            {/* Share Options */}
            {navigator.share && (
              <div className="pt-2">
                <Button
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: `${bookingTitle} - Shalean Cleaning Services`,
                        text: `View my booking details: ${bookingTitle}`,
                        url: shareUrl,
                      });
                      setShareDialogOpen(false);
                      toast.success('Shared successfully!');
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') {
                        toast.error('Failed to share');
                      }
                    }
                  }}
                  className="w-full gap-2"
                  aria-label="Share via native share"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share via...
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
