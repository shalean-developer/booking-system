import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";

// Optimized Logo component - static import, no client-side detection
function Logo() {
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-primary flex items-center justify-center">
      <Image 
        src="/logo.svg"
        alt="Shalean Logo"
        width={32}
        height={32}
        className="w-7 h-7 sm:w-8 sm:h-8 object-cover"
        priority={false}
      />
    </div>
  );
}

export function HomeFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Logo />
              <span className="text-lg sm:text-xl font-bold">Shalean</span>
            </div>
            <p className="text-sm sm:text-base text-gray-400 max-w-md">
              Professional cleaning services and solutions helping homeowners and businesses 
              maintain pristine, healthy environments.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-8">
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Services</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <Link href="/services/deep-specialty" className="block text-sm sm:text-base text-gray-400 hover:text-white">Deep Specialty Cleaning</Link>
                <Link href="/services/home-maintenance" className="block text-sm sm:text-base text-gray-400 hover:text-white">Home Maintenance</Link>
                <Link href="/services/move-turnover" className="block text-sm sm:text-base text-gray-400 hover:text-white">Move-in/Turnover</Link>
                <Link href="/booking/service/select" className="block text-sm sm:text-base text-gray-400 hover:text-white">Book Service</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <Link href="/about" className="block text-sm sm:text-base text-gray-400 hover:text-white">About Us</Link>
                <Link href="/team" className="block text-sm sm:text-base text-gray-400 hover:text-white">Our Team</Link>
                <Link href="/contact" className="block text-sm sm:text-base text-gray-400 hover:text-white">Contact Us</Link>
                <Link href="/careers" className="block text-sm sm:text-base text-gray-400 hover:text-white">Careers</Link>
                <Link href="/blog" className="block text-sm sm:text-base text-gray-400 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <Link href="/terms" className="block text-sm sm:text-base text-gray-400 hover:text-white">Terms & Conditions</Link>
                <Link href="/privacy" className="block text-sm sm:text-base text-gray-400 hover:text-white">Privacy Policy</Link>
                <Link href="/cancellation" className="block text-sm sm:text-base text-gray-400 hover:text-white">Cancellation Policy</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
            © 2025 Shalean Cleaning Services. All rights reserved.
          </p>
          <div className="flex gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
