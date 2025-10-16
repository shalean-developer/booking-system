'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfirmationPage() {
  useEffect(() => {
    // Clear booking state after successful submission
    // This is handled in the StepReview component before navigation
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl sm:text-4xl font-bold text-gray-900">
              Booking Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-base sm:text-lg text-slate-600">
              Thank you for booking with Shalean Cleaning Services. We&apos;ve received your cleaning request and will send you a confirmation email shortly.
            </p>

            <div className="rounded-xl bg-slate-50 p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                What&apos;s Next?
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>You&apos;ll receive a confirmation email with your booking details and payment link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Our team will contact you 24 hours before your scheduled cleaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>If you have any questions, feel free to reach out to us anytime</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 sm:p-6 border border-primary/10">
              <p className="text-sm text-center text-slate-700">
                <strong className="text-slate-900">Need to make changes?</strong>
                <br />
                Reply to your confirmation email or contact us at{' '}
                <a href="mailto:hello@shalean.co.za" className="text-primary hover:underline font-medium">
                  hello@shalean.co.za
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 px-1">
              <Button asChild variant="default" size="lg" className="w-full sm:flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Back to Home</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:flex-1">
                <Link href="/booking/service/select">
                  <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sm:hidden">Book Again</span>
                  <span className="hidden sm:inline">Book Another Service</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

