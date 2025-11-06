import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy | Shalean Cleaning Services",
  description: "Learn how Shalean protects your privacy and handles your personal data. POPIA compliant data protection practices, data collection, usage, security measures, and your rights regarding personal information.",
  canonical: generateCanonical("/privacy"),
});

export default function PrivacyPage() {
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
          <h1 className="mb-6 text-5xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-lg text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mt-0">1. Introduction</h2>
              <p className="text-gray-600">
                Shalean Cleaning Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our services or visit our website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-800">2.1 Personal Information</h3>
              <p className="text-gray-600">We collect information you provide directly to us, including:</p>
              <ul className="text-gray-600">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Booking details and service preferences</li>
                <li>Payment information</li>
                <li>Property access information</li>
                <li>Communications with our team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">2.2 Automatically Collected Information</h3>
              <p className="text-gray-600">When you visit our website, we may automatically collect:</p>
              <ul className="text-gray-600">
                <li>IP address and browser type</li>
                <li>Pages visited and time spent on site</li>
                <li>Referring website addresses</li>
                <li>Device information</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Information</h2>
              <p className="text-gray-600">We use the information we collect to:</p>
              <ul className="text-gray-600">
                <li>Provide and improve our cleaning services</li>
                <li>Process bookings and payments</li>
                <li>Communicate with you about services and appointments</li>
                <li>Send promotional materials (with your consent)</li>
                <li>Respond to inquiries and customer service requests</li>
                <li>Comply with legal obligations</li>
                <li>Detect and prevent fraud</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600">We do not sell your personal information. We may share your information with:</p>
              <ul className="text-gray-600">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operations (e.g., payment processors)</li>
                <li><strong>Team Members:</strong> Our cleaners receive necessary information to provide services</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">5. Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate technical and organizational security measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or
                electronic storage is 100% secure.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">6. Your Rights (POPIA Compliance)</h2>
              <p className="text-gray-600">Under South Africa's Protection of Personal Information Act (POPIA), you have the right to:</p>
              <ul className="text-gray-600">
                <li>Access your personal information we hold</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Lodge a complaint with the Information Regulator</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">7. Cookies and Tracking</h2>
              <p className="text-gray-600">
                We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookies
                through your browser settings. Disabling cookies may affect website functionality.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">8. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as necessary to provide services, comply with legal obligations,
                resolve disputes, and enforce agreements. Booking records are typically kept for 7 years for tax purposes.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">9. Children's Privacy</h2>
              <p className="text-gray-600">
                Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy
                on our website with an updated effective date.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">11. Contact Us</h2>
              <p className="text-gray-600">
                For questions about this Privacy Policy or to exercise your rights, contact:
              </p>
              <ul className="text-gray-600">
                <li>Email: support@shalean.com</li>
                <li>Phone: +27 87 153 5250</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/terms">Terms & Conditions</Link>
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

