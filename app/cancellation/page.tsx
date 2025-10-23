import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Clock, DollarSign, Calendar, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy | Shalean Cleaning Services",
  description: "Understand Shalean's cancellation and rescheduling policy. Flexible options with clear terms for your peace of mind.",
};

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/"><Home className="mr-2 h-4 w-4" />Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">Legal</Badge>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">Cancellation Policy</h1>
          <p className="text-lg text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8 prose prose-lg max-w-none">
              <p className="text-xl text-gray-600">
                At Shalean, we understand that plans change. This policy outlines our cancellation and rescheduling procedures
                to ensure fairness for both our customers and our cleaning professionals.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">Cancellation Timeframes</h2>
              <div className="grid md:grid-cols-3 gap-6 not-prose mb-8">
                <Card className="border shadow-md">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">24+ Hours Notice</h3>
                    <p className="text-sm text-gray-600">Full refund or free rescheduling</p>
                  </CardContent>
                </Card>
                <Card className="border shadow-md">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">12-24 Hours Notice</h3>
                    <p className="text-sm text-gray-600">50% cancellation fee</p>
                  </CardContent>
                </Card>
                <Card className="border shadow-md">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-red-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Less than 12 Hours</h3>
                    <p className="text-sm text-gray-600">Full service fee charged</p>
                  </CardContent>
                </Card>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Rescheduling</h2>
              <p className="text-gray-600">
                We're happy to accommodate rescheduling requests whenever possible:
              </p>
              <ul className="text-gray-600">
                <li><strong>24+ Hours Notice:</strong> Free rescheduling to any available date</li>
                <li><strong>12-24 Hours Notice:</strong> One free reschedule; additional changes may incur fees</li>
                <li><strong>Less than 12 Hours:</strong> Rescheduling fee applies</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">Refund Policy</h2>
              <p className="text-gray-600">
                Refunds are processed according to the cancellation timeframe above:
              </p>
              <ul className="text-gray-600">
                <li>Refunds are processed within 5-7 business days</li>
                <li>Refunds are issued to the original payment method</li>
                <li>Processing fees (if applicable) are non-refundable</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">Emergency Cancellations</h2>
              <p className="text-gray-600">
                We understand that true emergencies happen. In cases of:
              </p>
              <ul className="text-gray-600">
                <li>Medical emergencies</li>
                <li>Natural disasters</li>
                <li>Other unforeseen circumstances</li>
              </ul>
              <p className="text-gray-600">
                Please contact us immediately. We'll work with you to find a reasonable solution on a case-by-case basis.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">No-Show Policy</h2>
              <p className="text-gray-600">
                If our team arrives at your property and cannot gain access, or if you're not present when required:
              </p>
              <ul className="text-gray-600">
                <li>Full service fee will be charged</li>
                <li>Rescheduling will require advance payment</li>
                <li>We'll attempt to contact you at all provided numbers</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">Cancellation by Shalean</h2>
              <p className="text-gray-600">
                In rare cases, we may need to cancel or reschedule your appointment due to:
              </p>
              <ul className="text-gray-600">
                <li>Severe weather conditions</li>
                <li>Team member illness or emergency</li>
                <li>Unforeseen circumstances</li>
              </ul>
              <p className="text-gray-600">
                In such cases, we'll contact you immediately and offer:
              </p>
              <ul className="text-gray-600">
                <li>Priority rescheduling at your convenience</li>
                <li>Full refund if rescheduling doesn't work</li>
                <li>10% discount on your next service as an apology</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">How to Cancel or Reschedule</h2>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg not-prose">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">By Phone</h4>
                      <p className="text-gray-600">Call +27 87 153 5250 during business hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">By Email</h4>
                      <p className="text-gray-600">Email support@shalean.co.za with your booking reference</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Through Your Account</h4>
                      <p className="text-gray-600">Log in to manage your bookings online</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Questions?</h2>
              <p className="text-gray-600">
                If you have questions about our cancellation policy or need to discuss a specific situation, please don't
                hesitate to contact us. We're here to help make things work for you.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/terms">Terms & Conditions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

