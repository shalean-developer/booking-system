import { FAQS } from "@/lib/shalean-constants";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import { SITE_URL } from "@/lib/metadata";

/**
 * FAQPage JSON-LD for the homepage FAQ section — uses the same Q&A as `components/home-v2/faq.tsx` (FAQS).
 */
export function HomeFaqStructuredData() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#homepage-faq`,
    url: `${SITE_URL}/`,
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: stringifyStructuredData(faqPage, "FAQPage"),
      }}
    />
  );
}
