'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone } from 'lucide-react';

export function HomeContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Side - Contact Info */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-purple-600 uppercase tracking-wider mb-4">
              GET IN TOUCH
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              We&apos;re Here To Make Magic Happen!
            </h3>

            <div className="space-y-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Mail</h4>
                  <p className="text-gray-600">bookings@shalean.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                  <p className="text-gray-600">
                    Claremont, Cape Town<br />
                    Western Cape, South Africa
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                  <p className="text-gray-600">+27 87 153 5250</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-lg">
            <h4 className="text-2xl font-bold text-gray-900 mb-6">Get a free quote now!</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder="Bruce Wayne"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                  required
                />
                <label className="block text-sm text-gray-600 mt-2">Full name</label>
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="brucewayne@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full"
                  required
                />
                <label className="block text-sm text-gray-600 mt-2">Email ID</label>
              </div>

              <div>
                <Textarea
                  placeholder="Your query here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full min-h-[120px]"
                  required
                />
                <label className="block text-sm text-gray-600 mt-2">How can we help you?</label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full py-6 font-medium"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

