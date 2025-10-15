'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessPage() {
  useEffect(() => {
    // Clear booking state after successful submission
    // Done in the StepReview component after navigation
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mx-auto w-full max-w-lg border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle2 className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-slate-600">
              Thank you for booking with Shalean. We&apos;ve received your cleaning request and will send you
              a confirmation email shortly with all the details.
            </p>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">What&apos;s next?</strong>
                <br />
                You&apos;ll receive an email confirmation with your booking details and payment link.
                Our team will contact you 24 hours before your scheduled cleaning.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/booking">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Book Another
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

