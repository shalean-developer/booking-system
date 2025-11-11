import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "POPIA Compliance | Shalean Cleaning Services",
  description:
    "Understand how Shalean Cleaning Services complies with South Africa's Protection of Personal Information Act (POPIA). Learn about our lawful basis, security controls, and how to exercise your data rights.",
  canonical: generateCanonical("/popia"),
});

export default function PopiaPage() {
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
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">Legal</Badge>
          <h1 className="mb-3 text-5xl font-bold text-gray-900">POPIA Compliance Statement</h1>
          <p className="text-lg text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8 prose prose-lg max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-gray-600 mb-0">
                  Shalean Cleaning Services is committed to protecting personal information in line with the Protection of Personal
                  Information Act (Act 4 of 2013). This statement explains how we lawfully process, secure, and provide access to the
                  data entrusted to us.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-0">1. Lawful Processing</h2>
              <p className="text-gray-600">
                We collect and process personal information to deliver cleaning services, manage customer accounts, communicate
                appointment updates, and comply with regulatory obligations. Processing relies on consent, performance of a contract,
                or legitimate business interests as defined in POPIA.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">2. Categories of Information</h2>
              <ul className="text-gray-600">
                <li>Contact information such as name, email, phone number, and physical address</li>
                <li>Booking and service preferences to deliver tailored cleaning services</li>
                <li>Payment confirmations processed securely via approved third-party gateways</li>
                <li>Communications history including support requests and feedback</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">3. Security Measures</h2>
              <p className="text-gray-600">
                We implement organisational and technical safeguards including encrypted data transmission, role-based access,
                background-checked staff, and vendor due diligence. Incident response procedures are reviewed regularly.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">4. Data Subject Rights</h2>
              <p className="text-gray-600">
                You may request access, correction, or deletion of your personal information at any time. We respond to requests within
                20 business days as prescribed by POPIA. You may also object to certain processing activities or withdraw marketing
                consent.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">5. Sharing with Operators</h2>
              <p className="text-gray-600">
                Personal information is shared only with vetted operators (such as payment processors or CRM providers) under written
                agreements that uphold POPIA conditions. Data is never sold.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">6. Contact & Complaints</h2>
              <p className="text-gray-600 mb-4">
                For POPIA-related queries or requests, email <a href="mailto:support@shalean.co.za">support@shalean.co.za</a> or call
                +27 87 153 5250. If you believe your request has not been resolved satisfactorily, you may contact the Information
                Regulator of South Africa at <a href="mailto:complaints.IR@justice.gov.za">complaints.IR@justice.gov.za</a>.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/terms">Terms & Conditions</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

