import { SITE_URL } from "@/lib/metadata";

type Props = {
  name: string;
  description: string;
  url: string;
};

export default function ServiceStructuredData({ name, description, url }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    serviceType: name,
    description,
    url,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "City",
      name: "Cape Town",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
