import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Terms & Conditions | Shalean Cleaning Services",
  description: "Read our terms and conditions for using Shalean cleaning services. Learn about our policies, service agreements, customer responsibilities, cancellation policies, liability, and refund procedures.",
  canonical: generateCanonical("/terms"),
});

export default function TermsPage() {
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
          <h1 className="mb-6 text-5xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-lg text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mt-0">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By booking a cleaning service with Shalean Cleaning Services, you agree to be bound by these Terms and Conditions.
                Please read them carefully before using our services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">2. Services Provided</h2>
              <p className="text-gray-600">
                Shalean provides professional cleaning services including but not limited to:
              </p>
              <ul className="text-gray-600">
                <li>Standard cleaning for residential and commercial properties</li>
                <li>Deep cleaning services</li>
                <li>Move in/out cleaning</li>
                <li>Airbnb turnover cleaning</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">3. Booking and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-800">3.1 Booking</h3>
              <p className="text-gray-600">
                All bookings must be made through our website, phone, or email. We require at least 24 hours notice for standard bookings.
              </p>
              <h3 className="text-xl font-semibold text-gray-800">3.2 Payment Terms</h3>
              <p className="text-gray-600">
                Payment is due upon completion of service unless otherwise arranged. We accept cash, card, and bank transfer payments.
              </p>
              <h3 className="text-xl font-semibold text-gray-800">3.3 Pricing</h3>
              <p className="text-gray-600">
                All prices quoted are estimates based on information provided. Final pricing may vary based on actual conditions encountered.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">4. Cancellation and Rescheduling</h2>
              <p className="text-gray-600">
                Cancellations or rescheduling requests must be made at least 24 hours before the scheduled service time. Cancellations
                made with less than 24 hours notice may incur a cancellation fee. See our <Link href="/cancellation" className="text-primary hover:underline">Cancellation Policy</Link> for details.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">5. Customer Responsibilities</h2>
              <p className="text-gray-600">Customers are responsible for:</p>
              <ul className="text-gray-600">
                <li>Providing access to the property at the scheduled time</li>
                <li>Securing valuables and fragile items</li>
                <li>Disclosing any hazardous materials or special conditions</li>
                <li>Ensuring pets are secured during service</li>
                <li>Providing accurate property information during booking</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">6. Liability and Insurance</h2>
              <p className="text-gray-600">
                Shalean Cleaning Services is fully insured and bonded. We take every precaution to protect your property, but accidents
                can happen. Our liability is limited to the cost of the service provided or R5,000, whichever is less. Claims must be
                reported within 24 hours of service completion.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">7. Satisfaction Guarantee</h2>
              <p className="text-gray-600">
                We stand behind our work with a 100% satisfaction guarantee. If you're not satisfied with our service, contact us within
                24 hours and we'll return to address any concerns at no additional charge.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">8. Privacy</h2>
              <p className="text-gray-600">
                Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to
                understand how we collect, use, and protect your personal information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">9. Modifications to Terms</h2>
              <p className="text-gray-600">
                Shalean reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to our website.
                Continued use of our services constitutes acceptance of modified terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">10. Contact Information</h2>
              <p className="text-gray-600">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <ul className="text-gray-600">
                <li>Email: support@shalean.com</li>
                <li>Phone: +27 87 153 5250</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cancellation">Cancellation Policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

