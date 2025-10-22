import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function QuoteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="text-xl sm:text-2xl font-bold text-primary">Shalean</div>
            <span className="text-xs sm:text-sm text-gray-500 hidden xs:inline">Cleaning Services</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-4">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
