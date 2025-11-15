import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RelatedLink {
  title: string;
  href: string;
  description?: string;
}

interface InternalLinkingProps {
  type: 'service' | 'location';
  currentPage: string;
  relatedLinks: RelatedLink[];
  title?: string;
  description?: string;
}

export function InternalLinking({ 
  type, 
  currentPage, 
  relatedLinks,
  title,
  description 
}: InternalLinkingProps) {
  if (!relatedLinks || relatedLinks.length === 0) return null;

  const defaultTitle = type === 'service' 
    ? 'Related Services' 
    : 'Related Locations';
  
  const defaultDescription = type === 'service'
    ? 'Explore other professional cleaning services we offer'
    : 'Discover cleaning services in nearby areas';

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title || defaultTitle}
          </h2>
          <p className="text-xl text-gray-600">
            {description || defaultDescription}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedLinks.map((link, idx) => (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {link.title}
                  </Link>
                </h3>
                {link.description && (
                  <p className="text-gray-600 mb-4">
                    {link.description}
                  </p>
                )}
                <Link href={link.href}>
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

