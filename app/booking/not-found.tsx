'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';

export default function BookingNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <Home className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-bold text-gray-700 mb-4">Booking Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The booking page you're looking for doesn't exist. It may have been moved or the URL is incorrect.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/booking/service/standard/plan')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Booking
          </button>
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
