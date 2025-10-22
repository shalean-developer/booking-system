"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HomeTeam() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
            Meet Our Team
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Meet Our Team
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Our expert team leads by example, delivering exceptional cleaning services with care and professionalism.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                <Image
                  src="/images/team-normatter.webp"
                  alt="Normatter - Cleaning Expert"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 80px, 96px"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Normatter</h3>
              <div className="text-sm text-gray-600">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                  <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Normatter&apos;s team transformed our office completely. The attention to detail and eco-friendly approach exceeded our expectations. Highly recommend!&rdquo;</p>
                  <p className="text-xs text-gray-500 font-medium">- Sarah M., Corporate Client</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                <Image
                  src="/images/team-lucia.webp"
                  alt="Lucia - Commercial Cleaning Expert"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 80px, 96px"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Lucia</h3>
              <div className="text-sm text-gray-600">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                  <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Lucia&apos;s commercial cleaning service is outstanding. Our restaurant has never looked cleaner. Professional, reliable, and thorough every time.&rdquo;</p>
                  <p className="text-xs text-gray-500 font-medium">- David K., Restaurant Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                <Image
                  src="/images/team-nyasha.webp"
                  alt="Nyasha - Residential Cleaning Expert"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 80px, 96px"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Nyasha</h3>
              <div className="text-sm text-gray-600">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                  <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Nyasha&apos;s residential cleaning is exceptional. My home feels brand new after every visit. Trustworthy, efficient, and incredibly thorough.&rdquo;</p>
                  <p className="text-xs text-gray-500 font-medium">- Jennifer L., Homeowner</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
