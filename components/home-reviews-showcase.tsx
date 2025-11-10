import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const reviews = [
  {
    name: 'Sarah M.',
    location: 'Sea Point',
    rating: 5,
    text: 'Exceptional service! The cleaners arrived on time, were professional, and left our home spotless. Highly recommend Shalean.',
    date: '2 weeks ago'
  },
  {
    name: 'John K.',
    location: 'Camps Bay',
    rating: 5,
    text: 'We\'ve been using Shalean for 6 months now for our Airbnb turnovers. Always reliable, thorough, and excellent value.',
    date: '1 month ago'
  },
  {
    name: 'Emily T.',
    location: 'Claremont',
    rating: 5,
    text: 'The deep cleaning service was amazing! They tackled areas I\'ve been neglecting for months. Worth every cent.',
    date: '3 weeks ago'
  },
  {
    name: 'Michael R.',
    location: 'Green Point',
    rating: 5,
    text: 'Professional, punctual, and left our office sparkling. The team is well-trained and uses eco-friendly products.',
    date: '1 week ago'
  }
];

export function HomeReviewsShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Join 500+ satisfied customers who trust Shalean for professional cleaning
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">{review.text}</p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-600">{review.location}</p>
                  </div>
                <p className="text-sm text-gray-600">{review.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-gray-900">4.9/5</span> average rating from 500+ customers
          </p>
        </div>
      </div>
    </section>
  );
}

