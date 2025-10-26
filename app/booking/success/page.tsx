'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Calendar,
  MapPin,
  Clock,
  Home,
  Mail,
  Download,
  ArrowRight
} from "lucide-react";

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              Booking Confirmed
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              Thank You for Your Booking!
            </h1>
            <p className="text-xl text-gray-600">
              Your cleaning service has been confirmed. We&apos;ve sent a confirmation email with all the details.
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Service Date & Time</h3>
                    <p className="text-gray-600">Your scheduled service details will be in your confirmation email</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Service Type</h3>
                    <p className="text-gray-600">Your selected cleaning service details</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-600">Service address details sent to your email</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="border-0 shadow-lg mb-8 bg-blue-50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Check Your Email</h3>
                    <p className="text-gray-600 text-sm">We&apos;ve sent a detailed confirmation with all booking information</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Prepare Your Home</h3>
                    <p className="text-gray-600 text-sm">Clear surfaces and secure valuables before our team arrives</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">We&apos;ll Be There</h3>
                    <p className="text-gray-600 text-sm">Our professional cleaners will arrive on time, ready to work</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enjoy Your Clean Space</h3>
                    <p className="text-gray-600 text-sm">Relax and enjoy your spotless home</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1 border-primary text-primary hover:bg-primary/10"
            >
              <Mail className="mr-2 h-4 w-4" />
              Resend Confirmation
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          </div>

          {/* Return Home */}
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our customer service team is here to assist you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <span className="text-gray-600">
                📞 +27 87 153 5250
              </span>
              <span className="text-gray-600">
                ✉️ support@shalean.com
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

