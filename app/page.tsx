import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Home, CheckCircle, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Professional Cleaning Services</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Your Home Deserves
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              The Best Care
            </span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
            Book a professional cleaning service in minutes. Choose from standard cleaning, deep cleaning, 
            move in/out services, or Airbnb turnovers. Transparent pricing, trusted cleaners.
          </p>

          <Link href="/booking">
            <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-lg hover:shadow-xl">
              Book a Cleaning
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Card className="border-0 bg-white/50 backdrop-blur transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">Easy Booking</h3>
              <p className="text-sm text-slate-600">
                5-step wizard to customize your cleaning needs
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/50 backdrop-blur transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">Flexible Scheduling</h3>
              <p className="text-sm text-slate-600">
                Choose your preferred date and time slot
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/50 backdrop-blur transition-all hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">Transparent Pricing</h3>
              <p className="text-sm text-slate-600">
                See your total cost before you book
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

