'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Ticket, Clock } from 'lucide-react';
import Link from 'next/link';

interface SupportWidgetProps {
  openTicketsCount?: number;
  supportHours?: string;
  onLiveChat?: () => void;
  onCallSupport?: () => void;
}

export const SupportWidget = memo(function SupportWidget({
  openTicketsCount = 0,
  supportHours = 'Mon-Fri: 8AM-6PM',
  onLiveChat,
  onCallSupport,
}: SupportWidgetProps) {
  const handleLiveChat = useCallback(() => {
    if (onLiveChat) {
      onLiveChat();
    } else {
      // Open chat widget or navigate to chat page
      window.open('/contact?chat=true', '_blank');
    }
  }, [onLiveChat]);

  const handleCallSupport = useCallback(() => {
    if (onCallSupport) {
      onCallSupport();
    } else {
      // Open phone dialer
      window.location.href = 'tel:+27123456789';
    }
  }, [onCallSupport]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg font-semibold">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Live Chat */}
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white text-sm sm:text-base h-10 sm:h-11"
          onClick={handleLiveChat}
        >
          <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          Live Chat
        </Button>

        {/* Call Support */}
        <Button
          variant="outline"
          className="w-full border-blue-200 hover:bg-blue-50 text-sm sm:text-base h-10 sm:h-11 touch-manipulation"
          onClick={handleCallSupport}
        >
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          Call Support
        </Button>

        {/* Open Tickets */}
        <Button
          variant="ghost"
          className="w-full justify-between text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
          asChild
        >
          <Link href="/dashboard/tickets">
            <div className="flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Open Tickets</span>
            </div>
            {openTicketsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                {openTicketsCount}
              </span>
            )}
          </Link>
        </Button>

        {/* Support Hours */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{supportHours}</span>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
});
