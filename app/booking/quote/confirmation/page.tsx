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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mx-auto w-full max-w-lg border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Quote Request Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-slate-600">
              Thank you for your quote request! We&apos;ve received your cleaning requirements and will send you
              a personalized quote via email within 24 hours.
            </p>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">What&apos;s next?</strong>
                <br />
                You&apos;ll receive an email with your custom quote and next steps. 
                Our team will review your requirements and provide accurate pricing.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">
                Check your email for quote confirmation
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/booking/service/select">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Start Full Booking
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
