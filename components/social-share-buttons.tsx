"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Share2,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function SocialShareButtons({
  url,
  title,
  description,
  showLabel = false,
  compact = false
}: SocialShareButtonsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = description ? encodeURIComponent(description) : "";

  const sharePlatforms = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleShare = async (platform: keyof typeof sharePlatforms) => {
    if (typeof window !== 'undefined') {
      window.open(sharePlatforms[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  // Native share button for mobile
  const isMobile = typeof window !== 'undefined' && navigator.share && window.innerWidth < 768;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            {showLabel && "Share"}
          </Button>
        )}
        
        {!isMobile && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              {linkCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isMobile ? (
          <Button
            variant="default"
            onClick={handleNativeShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-5 w-5" />
            Share
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <MessageCircle className="h-5 w-5" />
              {showLabel && "WhatsApp"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Facebook className="h-5 w-5" />
              {showLabel && "Facebook"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Twitter className="h-5 w-5" />
              {showLabel && "Twitter"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Linkedin className="h-5 w-5" />
              {showLabel && "LinkedIn"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              {linkCopied ? (
                <>
                  <Check className="h-5 w-5" />
                  {showLabel && "Copied!"}
                </>
              ) : (
                <>
                  <LinkIcon className="h-5 w-5" />
                  {showLabel && "Copy Link"}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

