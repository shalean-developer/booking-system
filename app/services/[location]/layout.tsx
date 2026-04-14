import { ShaleanMobileCta } from "@/components/shalean-mobile-cta";

export default function ServiceLocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pb-24 lg:pb-0">{children}</div>
      <ShaleanMobileCta />
    </>
  );
}
