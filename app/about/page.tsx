import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { getSeoConfig } from '@/lib/seo-config';
import { stringifyStructuredData } from '@/lib/structured-data-validator';
import { ShaleanAboutPage } from '@/components/shalean-about-page';

export const metadata: Metadata = createMetadata(getSeoConfig('about'));

export default function AboutPage() {
  const faqs = [
    {
      question: 'When was Shalean Cleaning Services founded?',
      answer:
        "Shalean Cleaning Services was founded in 2020 with a mission to provide exceptional cleaning services across South Africa. We've grown from a small team to over 50 professional cleaners serving Cape Town, Johannesburg, Pretoria, and Durban.",
    },
    {
      question: 'What makes Shalean different from other cleaning companies?',
      answer:
        'Shalean combines professional expertise with exceptional customer service. We use eco-friendly products, provide flexible scheduling, offer online booking 24/7, and back every service with our satisfaction guarantee. Our team of 50+ vetted cleaners has served 500+ happy customers.',
    },
    {
      question: 'Are your cleaners insured and background-checked?',
      answer:
        'Yes, absolutely. All Shalean cleaners undergo thorough background checks, are fully insured, and professionally trained. We maintain a 98% customer satisfaction rate and stand behind every cleaning service with our 100% satisfaction guarantee.',
    },
    {
      question: 'What areas does Shalean serve?',
      answer:
        'We currently serve major cities across South Africa including Cape Town, Johannesburg, Pretoria, and Durban. Within these cities, we cover numerous suburbs and areas. Check our location pages to see if we service your area.',
    },
    {
      question: 'What cleaning services does Shalean offer?',
      answer:
        'We offer a comprehensive range of cleaning services including regular cleaning, deep cleaning, move-in/out cleaning, Airbnb turnover cleaning, office cleaning, apartment cleaning, window cleaning, and home maintenance cleaning. All services can be customized to your specific needs.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqSchema, 'FAQPage') }}
      />
      <ShaleanAboutPage />
    </>
  );
}
