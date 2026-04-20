'use client';

import { cn } from '@/lib/utils';

export interface BookingFlowLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  /** Step 4 shows the summary above the form on small screens; steps 1–3 hide it until `lg`. */
  sidebarOnMobile?: boolean;
  /** When `sidebarOnMobile` is true, stack main column first, then sidebar (checkout Step 4). */
  mobileSidebarAfterMain?: boolean;
  mainRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  /** Tailwind gap class for the main column stack (e.g. `gap-7`). */
  mainColumnClassName?: string;
}

export function BookingFlowLayout({
  children,
  sidebar,
  sidebarOnMobile = false,
  mobileSidebarAfterMain = false,
  mainRef,
  className,
  mainColumnClassName,
}: BookingFlowLayoutProps) {
  const mainOrderMobile = sidebarOnMobile && mobileSidebarAfterMain ? 'order-1' : 'order-2';
  const sidebarOrderMobile =
    sidebarOnMobile && mobileSidebarAfterMain ? 'order-2' : sidebarOnMobile ? 'order-1' : 'order-1';

  return (
    <div
      ref={mainRef}
      className={cn(
        'max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start pb-40 lg:pb-8',
        className
      )}
    >
      <div
        className={cn(
          mainOrderMobile,
          'lg:order-1 min-w-0 flex flex-col gap-6 w-full',
          mainColumnClassName
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'w-full flex-shrink-0 lg:self-stretch',
          sidebarOnMobile
            ? cn(sidebarOrderMobile, 'lg:order-2')
            : 'hidden lg:block order-1 lg:order-2'
        )}
      >
        <div className="sticky top-24 self-start">{sidebar}</div>
      </div>
    </div>
  );
}
