type FAQItem = {
  question: string;
  answer: string;
};

interface FAQSectionProps {
  suburb: string;
  faqItems: FAQItem[];
}

export function FAQSection({
  suburb,
  faqItems,
}: FAQSectionProps) {
  return (
    <section id="faqs" className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {suburb} Cleaning FAQs
          </h2>
          <p className="text-lg text-gray-600">
            Answers to common questions about booking vetted cleaners in {suburb}
          </p>
        </div>
        <div className="space-y-6">
          {faqItems.map((faq, index) => (
            <div key={`${faq.question}-${index}`} className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

