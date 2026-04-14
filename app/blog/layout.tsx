import { ShaleanMobileCta } from "@/components/shalean-mobile-cta";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-24 lg:pb-0">{children}</div>
      <ShaleanMobileCta />
    </>
  );
}
