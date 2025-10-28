import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Facebook, Linkedin, MessageCircle } from "lucide-react";

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
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-8 sm:mb-12">
          {/* Left Column - Brand & Contact Info (Wider) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Logo />
              <span className="text-xl font-bold">Shalean</span>
            </div>
            <p className="text-base text-gray-400 mb-8 max-w-md leading-relaxed">
              Professional cleaning services and solutions helping homeowners and businesses 
              maintain pristine, healthy environments across Cape Town.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.054-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <span className="text-gray-400">+27 87 153 5250</span>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">bookings@shalean.com</span>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <span className="text-gray-400">
                  Claremont, Cape Town
                  <br />
                  Western Cape, South Africa
                </span>
              </div>
            </div>
          </div>

          {/* Right Columns - Navigation Links (4 columns) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:col-span-3">
            {/* Services */}
            <div>
              <h3 className="font-semibold mb-4 text-base">Services</h3>
              <div className="space-y-3">
                <Link href="/services/deep-specialty" className="block text-sm text-gray-400 hover:text-white transition-colors">Deep Cleaning</Link>
                <Link href="/services/home-maintenance" className="block text-sm text-gray-400 hover:text-white transition-colors">Home Maintenance</Link>
                <Link href="/services/move-turnover" className="block text-sm text-gray-400 hover:text-white transition-colors">Move-in/Turnover</Link>
                <Link href="/booking/service/select" className="block text-sm text-gray-400 hover:text-white transition-colors">Book Service</Link>
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <h3 className="font-semibold mb-4 text-base">Service Areas</h3>
              <div className="space-y-3">
                <Link href="/location/cape-town/sea-point" className="block text-sm text-gray-400 hover:text-white transition-colors">Sea Point</Link>
                <Link href="/location/cape-town/camps-bay" className="block text-sm text-gray-400 hover:text-white transition-colors">Camps Bay</Link>
                <Link href="/location/cape-town/claremont" className="block text-sm text-gray-400 hover:text-white transition-colors">Claremont</Link>
                <Link href="/location/cape-town" className="block text-sm text-gray-400 hover:text-white transition-colors">All Areas</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4 text-base">Company</h3>
              <div className="space-y-3">
                <Link href="/about" className="block text-sm text-gray-400 hover:text-white transition-colors">About Us</Link>
                <Link href="/team" className="block text-sm text-gray-400 hover:text-white transition-colors">Our Team</Link>
                <Link href="/contact" className="block text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
                <Link href="/careers" className="block text-sm text-gray-400 hover:text-white transition-colors">Careers</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-800 mb-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left - Copyright */}
          <p className="text-sm text-gray-400 text-center md:text-left">
            © 2025 Shalean Cleaning Services. All rights reserved.
          </p>

          {/* Center - Legal Links */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/cancellation" className="text-sm text-gray-400 hover:text-white transition-colors">Cancellation Policy</Link>
          </div>

          {/* Right - Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://facebook.com/shaleancleaning" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Visit our Facebook page"
            >
              <Facebook className="h-5 w-5 text-gray-300" />
            </a>
            <a 
              href="https://www.linkedin.com/company/shaleancleaning" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Visit our LinkedIn page"
            >
              <Linkedin className="h-5 w-5 text-gray-300" />
            </a>
            <a 
              href="https://instagram.com/shaleancleaning" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Visit our Instagram profile"
            >
              <Instagram className="h-5 w-5 text-gray-300" />
            </a>
            <a 
              href="https://wa.me/27871535250" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Contact us on WhatsApp"
            >
              <MessageCircle className="h-5 w-5 text-gray-300" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
