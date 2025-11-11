import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, Home } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Cookie Policy | Shalean Cleaning Services",
  description:
    "Learn how Shalean Cleaning Services uses cookies and similar technologies to improve website performance, analytics, and user experience. Manage your preferences and understand our data practices.",
  canonical: generateCanonical("/cookies"),
});

export default function CookiePolicyPage() {
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
          <h1 className="mb-3 text-5xl font-bold text-gray-900">Cookie Policy</h1>
          <p className="text-lg text-gray-600 mb-8">Effective Date: January 1, 2025</p>

          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8 prose prose-lg max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <p className="text-gray-600 mb-0">
                  This Cookie Policy explains how Shalean Cleaning Services uses cookies and similar tracking technologies on our
                  website. It should be read together with our <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-0">1. What Are Cookies?</h2>
              <p className="text-gray-600">
                Cookies are small text files stored on your device when you visit a website. They allow the site to remember your
                actions and preferences over time to provide a more personalised experience.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">2. Types of Cookies We Use</h2>
              <ul className="text-gray-600">
                <li>
                  <strong>Essential cookies:</strong> Required for core site functionality such as secure login, booking forms, and
                  page navigation.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Help us understand how visitors interact with the website so we can improve
                  content and performance.
                </li>
                <li>
                  <strong>Functional cookies:</strong> Remember your preferences (such as language or region) to tailor content.
                </li>
                <li>
                  <strong>Marketing cookies:</strong> Used only with consent to deliver relevant promotions on other platforms.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900">3. Managing Your Preferences</h2>
              <p className="text-gray-600">
                You can accept or decline cookies via the consent banner on your first visit. You may also adjust settings in your
                browser to refuse cookies or delete existing ones. Disabling essential cookies may impact site functionality.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">4. Third-Party Technologies</h2>
              <p className="text-gray-600">
                We use trusted providers (including analytics and payment partners) who may set cookies in line with their own privacy
                notices. These partners are contractually obligated to protect personal information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">5. Updates</h2>
              <p className="text-gray-600">
                We may update this Cookie Policy to reflect changes in technology or legal requirements. Please review this page
                periodically for the latest information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900">6. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For questions about our use of cookies or to exercise your data rights, contact{" "}
                <a href="mailto:support@shalean.co.za">support@shalean.co.za</a>.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/popia">POPIA Compliance</Link>
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

