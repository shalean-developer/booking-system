'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuoteConfirmationPage() {
  useEffect(() => {
    // No specific state clearing needed for quote confirmation
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-3 sm:px-4 py-6 sm:py-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card className="mx-auto w-full max-w-lg border-0 shadow-xl">
          <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl px-2">Quote Request Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 text-center px-4 sm:px-6 pb-6 sm:pb-8">
            <p className="text-sm sm:text-base text-slate-600">
              Thank you for your quote request! We&apos;ve received your cleaning requirements and will send you
              a personalized quote via email within 24 hours.
            </p>

            <div className="rounded-lg bg-slate-50 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-slate-600">
                <strong className="text-slate-900">What&apos;s next?</strong>
                <br />
                You&apos;ll receive an email with your custom quote and next steps. 
                Our team will review your requirements and provide accurate pricing.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 sm:p-4 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-blue-800 font-medium">
                Check your email for quote confirmation
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:justify-center pt-2">
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Back to Home</span>
                </Button>
              </Link>
              <Link href="/booking/service/select" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <span className="sm:hidden">Book Now</span>
                  <span className="hidden sm:inline">Start Full Booking</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
